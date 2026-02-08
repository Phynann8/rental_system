using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;
using RentalSystem.Web.Data;
using RentalSystem.Web.Models;

namespace RentalSystem.Web.Pages.Print
{
    public class ReceiptModel : PageModel
    {
        private readonly RentalDbContext _context;

        public ReceiptModel(RentalDbContext context)
        {
            _context = context;
        }

        public Payment Payment { get; set; } = default!;

        public async Task<IActionResult> OnGetAsync(int id)
        {
            Payment = await _context.Payments
                .Include(p => p.Invoice).ThenInclude(i => i.Contract).ThenInclude(c => c.Tenant)
                .Include(p => p.Invoice).ThenInclude(i => i.Contract).ThenInclude(c => c.Room)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (Payment == null)
            {
                return NotFound();
            }

            return Page();
        }
    }
}
