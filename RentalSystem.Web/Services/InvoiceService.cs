using Microsoft.EntityFrameworkCore;
using RentalSystem.Web.Data;
using RentalSystem.Web.Models;

namespace RentalSystem.Web.Services
{
    /// <summary>
    /// Service for invoice generation with idempotency safeguards.
    /// Prevents duplicate invoice generation using database-level unique constraints.
    /// </summary>
    public interface IInvoiceService
    {
        /// <summary>
        /// Gets or creates an invoice for a contract in a specific month.
        /// Idempotent: calling multiple times with same parameters returns same invoice.
        /// Uses database unique constraint on InvoiceKey to prevent duplicates.
        /// </summary>
        /// <param name="contractId">ID of the contract</param>
        /// <param name="invoiceDate">Date to use for invoice (month/year extracted)</param>
        /// <param name="totalAmount">Total invoice amount</param>
        /// <param name="items">Fixed utility and rent items for the invoice period</param>
        /// <returns>Existing or newly created invoice</returns>
        Task<Invoice> GetOrCreateInvoiceAsync(
            int contractId,
            DateTime invoiceDate,
            decimal totalAmount,
            IEnumerable<(string description, decimal unitPrice)> items);

        /// <summary>
        /// Generates invoices for all active contracts in a building for a specific month.
        /// Wrapped in transaction to ensure atomicity: all succeed or all fail.
        /// </summary>
        /// <param name="buildingId">ID of the building</param>
        /// <param name="invoiceDate">Date to use for invoice generation</param>
        /// <param name="invoiceData">Generator function that yields (contractId, totalAmount, items) tuples</param>
        /// <returns>Count of newly generated invoices (excludes duplicates)</returns>
        Task<int> GenerateInvoicesForBuildingAsync(
            int buildingId,
            DateTime invoiceDate,
            Func<Contract, (decimal total, IEnumerable<(string description, decimal unitPrice)> items)> invoiceData);

        /// <summary>
        /// Orchestrates bulk invoice generation for a building, including utility calculation logic.
        /// Extracts code depth from controllers.
        /// </summary>
        Task<(int generated, int skipped)> BulkGenerateBuildingInvoicesAsync(int buildingId, DateTime invoiceDate);

        /// <summary>
        /// Checks if an invoice already exists for a contract in a given month.
        /// </summary>
        Task<bool> InvoiceExistsForPeriodAsync(int contractId, int year, int month);

        /// <summary>
        /// Generates the idempotency key for an invoice.
        /// Format: "{ContractId}_{YYYYMM}" e.g., "42_202604"
        /// </summary>
        string GenerateInvoiceKey(int contractId, DateTime date);
    }

    /// <summary>
    /// Production implementation of IInvoiceService with transaction and idempotency support.
    /// </summary>
    public class InvoiceService : IInvoiceService
    {
        private readonly RentalDbContext _context;
        private readonly ITransactionService _transactionService;

        public InvoiceService(RentalDbContext context, ITransactionService transactionService)
        {
            _context = context;
            _transactionService = transactionService;
        }

        /// <inheritdoc />
        public async Task<Invoice> GetOrCreateInvoiceAsync(
            int contractId,
            DateTime invoiceDate,
            decimal totalAmount,
            IEnumerable<(string description, decimal unitPrice)> items)
        {
            var invoiceKey = GenerateInvoiceKey(contractId, invoiceDate);
            var monthStart = new DateTime(invoiceDate.Year, invoiceDate.Month, 1);

            return await _transactionService.ExecuteInTransactionAsync(async () =>
            {
                // Try to find existing invoice with same key
                var existing = await _context.Invoices
                    .Include(i => i.Items)
                    .FirstOrDefaultAsync(i => i.InvoiceKey == invoiceKey);

                if (existing != null)
                {
                    // Idempotent: return existing invoice
                    return existing;
                }

                // Create new invoice
                var invoice = new Invoice
                {
                    ContractId = contractId,
                    Date = monthStart,
                    DueDate = monthStart.AddDays(14), // Due in 14 days
                    TotalAmount = totalAmount,
                    InvoiceKey = invoiceKey,
                    Status = InvoiceStatus.Unpaid
                };

                // Create invoice items
                foreach (var (description, unitPrice) in items)
                {
                    invoice.Items.Add(new InvoiceItem
                    {
                        Description = description,
                        Quantity = 1,
                        UnitPrice = unitPrice,
                        Total = unitPrice
                    });
                }

                _context.Invoices.Add(invoice);

                try
                {
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateException ex)
                when (ex.InnerException?.Message.Contains("IX_Invoices_InvoiceKey_Unique") ?? false)
                {
                    // Race condition: another process created invoice with same key
                    // Fetch and return it (idempotent behavior)
                    var result = await _context.Invoices
                        .Include(i => i.Items)
                        .FirstOrDefaultAsync(i => i.InvoiceKey == invoiceKey);
                    if (result == null)
                        throw;
                    return result;
                }

                return invoice;
            });
        }

        /// <inheritdoc />
        public async Task<int> GenerateInvoicesForBuildingAsync(
            int buildingId,
            DateTime invoiceDate,
            Func<Contract, (decimal total, IEnumerable<(string description, decimal unitPrice)> items)> invoiceData)
        {
            // All invoices for a building must be generated atomically
            return await _transactionService.ExecuteInTransactionAsync(async () =>
            {
                var contracts = await _context.Contracts
                    .Include(c => c.Room)
                    .Include(c => c.Tenant)
                    .Where(c => c.Status == ContractStatus.Active &&
                                c.Room != null &&
                                c.Room.BuildingId == buildingId)
                    .ToListAsync();

                var generated = 0;

                foreach (var contract in contracts)
                {
                    if (contract.Room == null || contract.Tenant == null)
                    {
                        continue;
                    }

                    // Get invoice data from provider function
                    var (totalAmount, items) = invoiceData(contract);

                    // Create or get existing invoice (idempotent)
                    var invoice = await GetOrCreateInvoiceAsync(
                        contract.Id,
                        invoiceDate,
                        totalAmount,
                        items);

                    // Only count newly created invoices (check if items were just added)
                    if (invoice.Items.Count > 0 && invoice.Id == 0)
                    {
                        generated++;
                    }
                }

                return generated;
            });
        }

        /// <inheritdoc />
        public async Task<(int generated, int skipped)> BulkGenerateBuildingInvoicesAsync(int buildingId, DateTime invoiceDate)
        {
            var billDate = invoiceDate.Date;
            
            var building = await _context.Buildings
                .AsNoTracking()
                .FirstOrDefaultAsync(b => b.Id == buildingId);
            
            if (building == null) throw new ArgumentException("Building not found", nameof(buildingId));

            var contracts = await _context.Contracts
                .Include(c => c.Room!).ThenInclude(r => r.Meters)
                .Include(c => c.Tenant)
                .Where(c => c.Status == ContractStatus.Active && c.Room != null && c.Room.BuildingId == buildingId)
                .ToListAsync();

            var generated = 0;
            var skipped = 0;

            foreach (var contract in contracts)
            {
                if (contract.Room == null || contract.Tenant == null)
                {
                    skipped++;
                    continue;
                }

                // Check if invoice already exists (idempotency)
                if (await InvoiceExistsForPeriodAsync(contract.Id, billDate.Year, billDate.Month))
                {
                    skipped++;
                    continue;
                }

                // Utility calculations
                var waterMeters = contract.Room.Meters
                    .Where(m => m.Type == MeterType.Water)
                    .OrderByDescending(m => m.LastReadingDate)
                    .Take(2).ToList();
                var electricMeters = contract.Room.Meters
                    .Where(m => m.Type == MeterType.Electric)
                    .OrderByDescending(m => m.LastReadingDate)
                    .Take(2).ToList();

                var waterUsage = waterMeters.Count == 2 ? Math.Max(0, waterMeters[0].CurrentReading - waterMeters[1].CurrentReading) : 0;
                var electricUsage = electricMeters.Count == 2 ? Math.Max(0, electricMeters[0].CurrentReading - electricMeters[1].CurrentReading) : 0;

                var waterCost = (decimal)waterUsage * building.WaterUnitPrice;
                var electricCost = (decimal)electricUsage * building.ElectricUnitPrice;
                var total = contract.RentPrice + waterCost + electricCost;

                var items = new List<(string description, decimal unitPrice)> { ("Rent", contract.RentPrice) };
                if (waterCost > 0) items.Add(($"Water ({waterUsage} units)", waterCost / (decimal)waterUsage));
                if (electricCost > 0) items.Add(($"Electricity ({electricUsage} units)", electricCost / (decimal)electricUsage));

                try
                {
                    await GetOrCreateInvoiceAsync(contract.Id, billDate, total, items);
                    generated++;
                }
                catch (DbUpdateException)
                {
                    skipped++;
                }
            }

            return (generated, skipped);
        }

        /// <inheritdoc />
        public async Task<bool> InvoiceExistsForPeriodAsync(int contractId, int year, int month)
        {
            var invoiceKey = GenerateInvoiceKey(contractId, new DateTime(year, month, 1));
            return await _context.Invoices
                .AsNoTracking()
                .AnyAsync(i => i.InvoiceKey == invoiceKey);
        }

        /// <inheritdoc />
        public string GenerateInvoiceKey(int contractId, DateTime date)
        {
            return $"{contractId}_{date:yyyyMM}";
        }
    }
}
