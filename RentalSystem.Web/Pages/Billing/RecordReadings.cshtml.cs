using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;
using RentalSystem.Web.Data;
using RentalSystem.Web.Models;

namespace RentalSystem.Web.Pages.Billing
{
    public class RecordReadingsModel : PageModel
    {
        private readonly RentalDbContext _context;

        public RecordReadingsModel(RentalDbContext context)
        {
            _context = context;
        }

        public IList<Building> Buildings { get; set; } = new List<Building>();

        [BindProperty(SupportsGet = true)]
        public int? SelectedBuildingId { get; set; }

        [BindProperty]
        public List<RoomReadingViewModel> RoomReadings { get; set; } = new List<RoomReadingViewModel>();

        public async Task OnGetAsync()
        {
            Buildings = await _context.Buildings.ToListAsync();

            if (SelectedBuildingId.HasValue)
            {
                var rooms = await _context.Rooms
                    .Include(r => r.RoomType)
                    .Include(r => r.Meters)
                    .Where(r => r.BuildingId == SelectedBuildingId && r.Status == RoomStatus.Occupied)
                    .OrderBy(r => r.RoomNumber)
                    .ToListAsync();

                RoomReadings = rooms.Select(r => new RoomReadingViewModel
                {
                    RoomId = r.Id,
                    RoomNumber = r.RoomNumber,
                    RoomType = r.RoomType?.Name ?? "N/A",
                    // Fetch last reading or 0
                    OldWater = r.Meters.Where(m => m.Type == MeterType.Water).OrderByDescending(m => m.LastReadingDate).FirstOrDefault()?.CurrentReading ?? 0,
                    OldElectric = r.Meters.Where(m => m.Type == MeterType.Electric).OrderByDescending(m => m.LastReadingDate).FirstOrDefault()?.CurrentReading ?? 0,
                    // Default New to Old
                    NewWater = r.Meters.Where(m => m.Type == MeterType.Water).OrderByDescending(m => m.LastReadingDate).FirstOrDefault()?.CurrentReading ?? 0,
                    NewElectric = r.Meters.Where(m => m.Type == MeterType.Electric).OrderByDescending(m => m.LastReadingDate).FirstOrDefault()?.CurrentReading ?? 0
                }).ToList();
            }
        }

        public async Task<IActionResult> OnPostAsync()
        {
            if (RoomReadings == null || !RoomReadings.Any())
            {
                return RedirectToPage();
            }

            foreach (var item in RoomReadings)
            {
                // Save Water
                if (item.NewWater > item.OldWater || item.NewWater == item.OldWater) // Allow equal, forbid lower (unless meter reset, handle later)
                {
                    _context.UtilityMeters.Add(new UtilityMeter
                    {
                        RoomId = item.RoomId,
                        Type = MeterType.Water,
                        CurrentReading = item.NewWater,
                        LastReadingDate = DateTime.Now
                    });
                }

                // Save Electric
                if (item.NewElectric > item.OldElectric || item.NewElectric == item.OldElectric)
                {
                    _context.UtilityMeters.Add(new UtilityMeter
                    {
                        RoomId = item.RoomId,
                        Type = MeterType.Electric,
                        CurrentReading = item.NewElectric,
                        LastReadingDate = DateTime.Now
                    });
                }
            }

            await _context.SaveChangesAsync();
            return RedirectToPage("./RecordReadings", new { buildingId = SelectedBuildingId });
        }

        public class RoomReadingViewModel
        {
            public int RoomId { get; set; }
            public string RoomNumber { get; set; } = string.Empty;
            public string RoomType { get; set; } = string.Empty;

            public double OldWater { get; set; }
            public double NewWater { get; set; }

            public double OldElectric { get; set; }
            public double NewElectric { get; set; }
        }
    }
}
