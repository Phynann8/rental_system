using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;
using RentalSystem.Web.Data;
using RentalSystem.Web.Models;

namespace RentalSystem.Web.Pages.Print
{
    public class InvoiceModel : PageModel
    {
        private readonly RentalDbContext _context;

        public InvoiceModel(RentalDbContext context)
        {
            _context = context;
        }

        public Invoice Invoice { get; private set; } = null!;

        public async Task<IActionResult> OnGetAsync(int id)
        {
            var invoice = await _context.Invoices
                .AsNoTracking()
                .Include(i => i.Items)
                .Include(i => i.Contract!).ThenInclude(c => c.Room)
                .Include(i => i.Contract!).ThenInclude(c => c.Tenant)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (invoice == null || invoice.Contract == null || invoice.Contract.Room == null || invoice.Contract.Tenant == null)
            {
                return NotFound();
            }
            Invoice = invoice;
            return Page();
        }
    }
}
