using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;
using RentalSystem.Web.Data;
using RentalSystem.Web.Models;

namespace RentalSystem.Web.Pages.Configuration.Rooms
{
    public class IndexModel : PageModel
    {
        private readonly RentalDbContext _context;

        public IndexModel(RentalDbContext context)
        {
            _context = context;
        }

        public IList<Room> Rooms { get; set; } = default!;

        public async Task OnGetAsync()
        {
            Rooms = await _context.Rooms
                .Include(r => r.Building)
                .Include(r => r.RoomType)
                .OrderBy(r => r.BuildingId)
                .ThenBy(r => r.RoomNumber)
                .ToListAsync();
        }
    }
}
