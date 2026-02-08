using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;
using RentalSystem.Web.Data;
using RentalSystem.Web.Models;

namespace RentalSystem.Web.Pages.Configuration.Buildings
{
    public class IndexModel : PageModel
    {
        private readonly RentalDbContext _context;

        public IndexModel(RentalDbContext context)
        {
            _context = context;
        }

        public IList<Building> Buildings { get; set; } = default!;

        public async Task OnGetAsync()
        {
            Buildings = await _context.Buildings
                .Include(b => b.Rooms)
                .ToListAsync();
        }
    }
}
