using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;
using RentalSystem.Web.Data;
using RentalSystem.Web.Models;

namespace RentalSystem.Web.Pages.Configuration.RoomTypes
{
    public class IndexModel : PageModel
    {
        private readonly RentalDbContext _context;

        public IndexModel(RentalDbContext context)
        {
            _context = context;
        }

        public IList<RoomType> RoomTypes { get; set; } = default!;

        public async Task OnGetAsync()
        {
            RoomTypes = await _context.RoomTypes.ToListAsync();
        }
    }
}
