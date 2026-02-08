using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;
using RentalSystem.Web.Data;
using RentalSystem.Web.Models;

namespace RentalSystem.Web.Pages.Billing
{
    public class IndexModel : PageModel
    {
        private readonly RentalDbContext _context;

        public IndexModel(RentalDbContext context)
        {
            _context = context;
        }

        public IList<Invoice> Invoices { get; set; } = default!;

        public async Task OnGetAsync()
        {
            Invoices = await _context.Invoices
                .Include(i => i.Contract).ThenInclude(c => c.Room)
                .Include(i => i.Contract).ThenInclude(c => c.Tenant)
                .OrderByDescending(i => i.Date)
                .ToListAsync();
        }
    }
}
