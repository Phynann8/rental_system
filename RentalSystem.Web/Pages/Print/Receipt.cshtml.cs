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

        public Payment Payment { get; private set; } = null!;

        public async Task<IActionResult> OnGetAsync(int id)
        {
            var payment = await _context.Payments
                .AsNoTracking()
                .Include(p => p.Invoice!)
                .ThenInclude(i => i.Contract!)
                .ThenInclude(c => c.Tenant)
                .Include(p => p.Invoice!)
                .ThenInclude(i => i.Contract!)
                .ThenInclude(c => c.Room)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (payment == null || payment.Invoice == null || payment.Invoice.Contract == null || payment.Invoice.Contract.Room == null || payment.Invoice.Contract.Tenant == null)
            {
                return NotFound();
            }
            Payment = payment;
            return Page();
        }
    }
}
