using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;
using RentalSystem.Web.Data;
using RentalSystem.Web.Models;

namespace RentalSystem.Web.Pages.Billing
{
    public class GenerateModel : PageModel
    {
        private readonly RentalDbContext _context;

        public GenerateModel(RentalDbContext context)
        {
            _context = context;
        }

        public IList<Building> Buildings { get; set; } = new List<Building>();

        [BindProperty(SupportsGet = true)]
        public int? SelectedBuildingId { get; set; }

        [BindProperty]
        public List<InvoicePreviewViewModel> InvoicePreviews { get; set; } = new List<InvoicePreviewViewModel>();

        public async Task OnGetAsync()
        {
            Buildings = await _context.Buildings
                .AsNoTracking()
                .ToListAsync();

            if (SelectedBuildingId.HasValue)
            {
                var buildingId = SelectedBuildingId.Value;
                var building = await _context.Buildings
                    .AsNoTracking()
                    .FirstOrDefaultAsync(b => b.Id == buildingId);
                var waterRate = building?.WaterUnitPrice ?? 0;
                var electricRate = building?.ElectricUnitPrice ?? 0;

                var contracts = await _context.Contracts
                    .AsNoTracking()
                    .Include(c => c.Room!)
                    .ThenInclude(r => r.Meters)
                    .Include(c => c.Tenant)
                    .Where(c => c.Room != null && c.Room.BuildingId == buildingId && c.Status == ContractStatus.Active)
                    .ToListAsync();

                foreach (var contract in contracts)
                {
                    // Null checks for Room and Tenant
                    if (contract.Room == null || contract.Tenant == null) continue;

                    // Logic: Get Last 2 readings to calculate usage
                    // For Production: Needs strict "Billing Cycle" logic. 
                    // For MVP: Diff between latest reading and previous reading.

                    var waterMeters = contract.Room.Meters
                        .Where(m => m.Type == MeterType.Water)
                        .OrderByDescending(m => m.LastReadingDate)
                        .Take(2)
                        .ToList();
                    var eleMeters = contract.Room.Meters
                        .Where(m => m.Type == MeterType.Electric)
                        .OrderByDescending(m => m.LastReadingDate)
                        .Take(2)
                        .ToList();

                    double waterUsage = (waterMeters.Count == 2) ? waterMeters[0].CurrentReading - waterMeters[1].CurrentReading : 0;
                    double eleUsage = (eleMeters.Count == 2) ? eleMeters[0].CurrentReading - eleMeters[1].CurrentReading : 0;

                    // Ensure no negative usage (meter rollover handling needed in real app)
                    if (waterUsage < 0) waterUsage = 0;
                    if (eleUsage < 0) eleUsage = 0;

                    var vm = new InvoicePreviewViewModel
                    {
                        ContractId = contract.Id,
                        RoomNumber = contract.Room.RoomNumber,
                        TenantName = contract.Tenant.Name,
                        RentAmount = contract.RentPrice,
                        WaterUsage = waterUsage,
                        WaterCost = (decimal)waterUsage * waterRate,
                        ElectricUsage = eleUsage,
                        ElectricCost = (decimal)eleUsage * electricRate,
                        IsSelected = true
                    };
                    vm.TotalAmount = vm.RentAmount + vm.WaterCost + vm.ElectricCost;
                    InvoicePreviews.Add(vm);
                }
            }
        }

        public async Task<IActionResult> OnPostAsync()
        {
            if (InvoicePreviews == null || !InvoicePreviews.Any()) return RedirectToPage();

            foreach (var item in InvoicePreviews.Where(x => x.IsSelected))
            {
                var invoice = new Invoice
                {
                    ContractId = item.ContractId,
                    Date = DateTime.Now,
                    DueDate = DateTime.Now.AddDays(5),
                    TotalAmount = item.TotalAmount,
                    Status = InvoiceStatus.Unpaid
                };

                // Add Line Items
                invoice.Items.Add(new InvoiceItem { Description = "Rent", UnitPrice = item.RentAmount, Quantity = 1, Total = item.RentAmount });
                
                if (item.WaterCost > 0)
                    invoice.Items.Add(new InvoiceItem { Description = $"Water ({item.WaterUsage} units)", UnitPrice = item.WaterCost / (decimal)(item.WaterUsage == 0 ? 1 : item.WaterUsage), Quantity = item.WaterUsage, Total = item.WaterCost });
                
                if (item.ElectricCost > 0)
                    invoice.Items.Add(new InvoiceItem { Description = $"Electricity ({item.ElectricUsage} units)", UnitPrice = item.ElectricCost / (decimal)(item.ElectricUsage == 0 ? 1 : item.ElectricUsage), Quantity = item.ElectricUsage, Total = item.ElectricCost });

                _context.Invoices.Add(invoice);
            }

            await _context.SaveChangesAsync();
            // Redirect to Invoice List (Todo)
            return RedirectToPage("/Billing/Index"); // Assuming we create an Index listing Invoices
        }

        public class InvoicePreviewViewModel
        {
            public int ContractId { get; set; }
            public string RoomNumber { get; set; } = string.Empty;
            public string TenantName { get; set; } = string.Empty;
            
            public decimal RentAmount { get; set; }
            
            public double WaterUsage { get; set; }
            public decimal WaterCost { get; set; }

            public double ElectricUsage { get; set; }
            public decimal ElectricCost { get; set; }

            public decimal TotalAmount { get; set; }
            public bool IsSelected { get; set; }
        }
    }
}
