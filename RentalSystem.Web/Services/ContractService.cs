using Microsoft.EntityFrameworkCore;
using RentalSystem.Web.Data;
using RentalSystem.Web.Models;

namespace RentalSystem.Web.Services
{
    /// <summary>
    /// Service for contract (lease) management with concurrency safeguards.
    /// Prevents double-booking of tenants and rooms using database indexes.
    /// </summary>
    public interface IContractService
    {
        /// <summary>
        /// Creates a new lease contract and updates room status atomically.
        /// Validates that:
        /// - Tenant doesn't already have an active lease
        /// - Room isn't already occupied/leased
        /// - End date is after start date
        /// All validations and updates happen within a transaction.
        /// </summary>
        /// <param name="tenantId">ID of the tenant</param>
        /// <param name="roomId">ID of the room</param>
        /// <param name="startDate">Lease start date</param>
        /// <param name="endDate">Lease end date</param>
        /// <param name="rentPrice">Monthly rent price</param>
        /// <param name="depositAmount">Security deposit</param>
        /// <returns>Created contract with room status updated</returns>
        Task<Contract> CreateLeaseAsync(
            int tenantId,
            int roomId,
            DateTime startDate,
            DateTime endDate,
            decimal rentPrice,
            decimal depositAmount);

        /// <summary>
        /// Checks if a tenant currently has an active lease.
        /// Uses database index for efficient querying.
        /// </summary>
        Task<bool> TenantHasActiveLease(int tenantId);

        /// <summary>
        /// Checks if a room currently has an active lease/is occupied.
        /// Uses database index for efficient querying.
        /// </summary>
        Task<bool> RoomHasActiveLease(int roomId);

        /// <summary>
        /// Checks if a date range overlaps with any existing active contracts for a room.
        /// Used for advanced lease scheduling.
        /// </summary>
        Task<bool> ContractDateRangeOverlaps(int roomId, DateTime startDate, DateTime endDate);
    }

    /// <summary>
    /// Production implementation of IContractService with transaction support.
    /// </summary>
    public class ContractService : IContractService
    {
        private readonly RentalDbContext _context;
        private readonly ITransactionService _transactionService;
        private readonly INotificationService _notificationService;

        public ContractService(RentalDbContext context, ITransactionService transactionService, INotificationService notificationService)
        {
            _context = context;
            _transactionService = transactionService;
            _notificationService = notificationService;
        }

        /// <inheritdoc />
        public async Task<Contract> CreateLeaseAsync(
            int tenantId,
            int roomId,
            DateTime startDate,
            DateTime endDate,
            decimal rentPrice,
            decimal depositAmount)
        {
            // Validate inputs
            if (endDate <= startDate)
            {
                throw new ArgumentException("End date must be after start date.", nameof(endDate));
            }

            if (rentPrice < 0 || depositAmount < 0)
            {
                throw new ArgumentException("Rent and deposit amounts cannot be negative.");
            }

            return await _transactionService.ExecuteInTransactionAsync(async () =>
            {
                // Fetch entities (locks them for the duration of the transaction)
                var tenant = await _context.Tenants
                    .FirstOrDefaultAsync(t => t.Id == tenantId);

                if (tenant == null)
                {
                    throw new InvalidOperationException($"Tenant with ID {tenantId} not found.");
                }

                var room = await _context.Rooms
                    .Include(r => r.Building)
                    .Include(r => r.RoomType)
                    .FirstOrDefaultAsync(r => r.Id == roomId);

                if (room == null)
                {
                    throw new InvalidOperationException($"Room with ID {roomId} not found.");
                }

                // Validate tenant isn't already leasing another room
                var tenantHasActiveLease = await _context.Contracts
                    .AnyAsync(c => c.TenantId == tenantId && c.Status == ContractStatus.Active);

                if (tenantHasActiveLease)
                {
                    throw new InvalidOperationException(
                        "This tenant already has an active lease. Terminate the existing lease before creating a new one.");
                }

                // Validate room isn't already leased
                var roomHasActiveLease = await _context.Contracts
                    .AnyAsync(c => c.RoomId == roomId && c.Status == ContractStatus.Active);

                if (roomHasActiveLease)
                {
                    throw new InvalidOperationException(
                        "This room already has an active lease. Complete or terminate the existing lease before creating a new one.");
                }

                // Validate room status (additional safety check)
                if (room.Status == RoomStatus.Occupied)
                {
                    throw new InvalidOperationException(
                        "This room is marked as occupied. Update room status to Vacant before creating a lease.");
                }

                // Create contract
                var contract = new Contract
                {
                    TenantId = tenantId,
                    RoomId = roomId,
                    StartDate = startDate.Date,
                    EndDate = endDate.Date,
                    RentPrice = rentPrice,
                    DepositAmount = depositAmount,
                    Status = ContractStatus.Active
                };

                // Update room status
                room.Status = RoomStatus.Occupied;

                _context.Contracts.Add(contract);
                _context.Rooms.Update(room);

                try
                {
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateException ex)
                when (ex.Message.Contains("IX_Contracts", StringComparison.OrdinalIgnoreCase) ||
                      ex.Message.Contains("IX_Rooms", StringComparison.OrdinalIgnoreCase))
                {
                    // Likely a constraint violation (race condition or duplicate key)
                    throw new InvalidOperationException(
                        "Failed to create contract. Room may have been leased or tenant may have another active lease. Please refresh and try again.",
                        ex);
                }

                // Trigger notification
                await _notificationService.CreateNotificationAsync(
                    contract.OrganizationId,
                    "Lease Created",
                    $"New lease created for Room {room.RoomNumber}",
                    NotificationType.Success,
                    $"/reports?contractId={contract.Id}"
                );

                return contract;
            });
        }

        /// <inheritdoc />
        public async Task<bool> TenantHasActiveLease(int tenantId)
        {
            return await _context.Contracts
                .AsNoTracking()
                .AnyAsync(c => c.TenantId == tenantId && c.Status == ContractStatus.Active);
        }

        /// <inheritdoc />
        public async Task<bool> RoomHasActiveLease(int roomId)
        {
            return await _context.Contracts
                .AsNoTracking()
                .AnyAsync(c => c.RoomId == roomId && c.Status == ContractStatus.Active);
        }

        /// <inheritdoc />
        public async Task<bool> ContractDateRangeOverlaps(int roomId, DateTime startDate, DateTime endDate)
        {
            return await _context.Contracts
                .AsNoTracking()
                .Where(c => c.RoomId == roomId && c.Status == ContractStatus.Active)
                .AnyAsync(c => c.StartDate < endDate && c.EndDate > startDate);
        }
    }
}
