using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;
using RentalSystem.Web.Data;
using RentalSystem.Web.Models;

namespace RentalSystem.Web.Pages.Map
{
    public class IndexModel : PageModel
    {
        private readonly RentalDbContext _context;

        public IndexModel(RentalDbContext context)
        {
            _context = context;
        }

        public IList<Building> Buildings { get; set; } = new List<Building>();
        
        // Grouped by Floor Number
        public Dictionary<int, List<Room>>? GroupedRooms { get; set; }

        [BindProperty(SupportsGet = true)]
        public int? SelectedBuildingId { get; set; }
        
        public string SelectedBuildingName { get; set; } = string.Empty;

        public async Task OnGetAsync()
        {
            Buildings = await _context.Buildings.OrderBy(b => b.Name).ToListAsync();

            if (SelectedBuildingId.HasValue)
            {
                var building = await _context.Buildings.FindAsync(SelectedBuildingId.Value);
                if (building != null)
                {
                    SelectedBuildingName = building.Name;
                    
                    var rooms = await _context.Rooms
                        .Where(r => r.BuildingId == SelectedBuildingId.Value)
                        .Include(r => r.RoomType)
                        .ToListAsync();

                    GroupedRooms = rooms
                        .GroupBy(r => r.Floor)
                        .ToDictionary(g => g.Key, g => g.ToList());
                }
            }
        }
    }
}
