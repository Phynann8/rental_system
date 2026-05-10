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
        public Payment Payment { get; set; } = new();

        public Invoice Invoice { get; private set; } = null!;

        public async Task<IActionResult> OnGetAsync(int id)
        {
            var invoice = await LoadInvoiceForDisplayAsync(id);
            if (invoice == null)
            {
                return NotFound();
            }

            Invoice = invoice;

            decimal alreadyPaid = invoice.Payments.Sum(p => p.Amount);
            decimal remaining = invoice.TotalAmount - alreadyPaid;

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
            var pageInvoice = await LoadInvoiceForDisplayAsync(Payment.InvoiceId);
            if (pageInvoice == null)
            {
                return NotFound();
            }

            Invoice = pageInvoice;

            if (!ModelState.IsValid)
            {
                return Page();
            }

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

        private Task<Invoice?> LoadInvoiceForDisplayAsync(int invoiceId)
        {
            return _context.Invoices
                .AsNoTracking()
                .Include(i => i.Contract!).ThenInclude(c => c.Tenant)
                .Include(i => i.Contract!).ThenInclude(c => c.Room)
                .Include(i => i.Payments)
                .FirstOrDefaultAsync(i =>
                    i.Id == invoiceId &&
                    i.Contract != null &&
                    i.Contract.Tenant != null &&
                    i.Contract.Room != null);
        }
    }
}
