using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;
using RentalSystem.Web.Data;
using RentalSystem.Web.Models;

namespace RentalSystem.Web.Pages.Tenancy.Tenants
{
    public class IndexModel : PageModel
    {
        private readonly RentalDbContext _context;

        public IndexModel(RentalDbContext context)
        {
            _context = context;
        }

        public IList<Tenant> Tenants { get; set; } = default!;

        public async Task OnGetAsync()
        {
            Tenants = await _context.Tenants
                .Include(t => t.Contracts)
                .ToListAsync();
        }
    }
}
