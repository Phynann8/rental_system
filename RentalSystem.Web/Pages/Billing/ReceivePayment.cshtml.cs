using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;
using RentalSystem.Web.Data;
using RentalSystem.Web.Models;

namespace RentalSystem.Web.Pages.Billing
{
    public class ReceivePaymentModel : PageModel
    {
        private readonly RentalDbContext _context;

        public ReceivePaymentModel(RentalDbContext context)
        {
            _context = context;
        }

        [BindProperty]
        public Payment Payment { get; set; } = default!;

        public Invoice Invoice { get; set; } = default!;

        public async Task<IActionResult> OnGetAsync(int id)
        {
            Invoice = await _context.Invoices
                .Include(i => i.Contract).ThenInclude(c => c.Tenant)
                .Include(i => i.Contract).ThenInclude(c => c.Room)
                .Include(i => i.Payments)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (Invoice == null)
            {
                return NotFound();
            }

            decimal alreadyPaid = Invoice.Payments.Sum(p => p.Amount);
            decimal remaining = Invoice.TotalAmount - alreadyPaid;

            Payment = new Payment
            {
                InvoiceId = id,
                Amount = remaining,
                Date = DateTime.Now,
                Method = PaymentMethod.Cash
            };

            return Page();
        }

        public async Task<IActionResult> OnPostAsync()
        {
            var invoice = await _context.Invoices
                .Include(i => i.Payments)
                .FirstOrDefaultAsync(i => i.Id == Payment.InvoiceId);

            if (invoice == null)
            {
                return NotFound();
            }

            _context.Payments.Add(Payment);
            await _context.SaveChangesAsync();

            // Update Invoice Status
            decimal totalPaid = invoice.Payments.Sum(p => p.Amount);
            
            if (totalPaid >= invoice.TotalAmount)
            {
                invoice.Status = InvoiceStatus.Paid;
            }
            else if (totalPaid > 0)
            {
                invoice.Status = InvoiceStatus.Partial;
            }

            await _context.SaveChangesAsync();

            return RedirectToPage("/Print/Receipt", new { id = Payment.Id });
        }
    }
}
