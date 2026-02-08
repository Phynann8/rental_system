using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;
using RentalSystem.Web.Data;
using RentalSystem.Web.Models;

namespace RentalSystem.Web.Pages.Tenancy.Contracts
{
    public class IndexModel : PageModel
    {
        private readonly RentalDbContext _context;

        public IndexModel(RentalDbContext context)
        {
            _context = context;
        }

        public IList<Contract> Contracts { get; set; } = default!;

        public async Task OnGetAsync()
        {
            Contracts = await _context.Contracts
                .Include(c => c.Room)
                .Include(c => c.Tenant)
                .OrderByDescending(c => c.Status) // Active first
                .ThenByDescending(c => c.StartDate)
                .ToListAsync();
        }
    }
}
