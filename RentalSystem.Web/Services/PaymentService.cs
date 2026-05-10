using Microsoft.EntityFrameworkCore;
using RentalSystem.Web.Data;
using RentalSystem.Web.Models;

namespace RentalSystem.Web.Services
{
    /// <summary>
    /// Service for payment processing with concurrency safeguards and data integrity.
    /// Ensures payments cannot exceed invoice balance and prevents race conditions.
    /// </summary>
    public interface IPaymentService
    {
        /// <summary>
        /// Records a payment for an invoice with validation and status updates.
        /// Throws InvalidOperationException if payment exceeds remaining balance.
        /// Throws DbUpdateConcurrencyException if invoice was modified during processing.
        /// </summary>
        /// <param name="invoiceId">ID of the invoice being paid</param>
        /// <param name="amount">Payment amount (decimal to prevent float rounding errors)</param>
        /// <param name="method">Payment method used</param>
        /// <returns>The created Payment entity</returns>
        Task<Payment> RecordPaymentAsync(int invoiceId, decimal amount, PaymentMethod method);

        /// <summary>
        /// Gets the remaining balance on an invoice (TotalAmount - sum of all payments).
        /// Uses a database query to ensure accuracy across concurrent requests.
        /// </summary>
        /// <param name="invoiceId">ID of the invoice</param>
        /// <returns>Remaining balance amount</returns>
        Task<decimal> GetRemainingBalanceAsync(int invoiceId);

        /// <summary>
        /// Updates invoice status based on payment coverage.
        /// Should be called after each payment is recorded.
        /// </summary>
        /// <param name="invoiceId">ID of the invoice</param>
        Task UpdateInvoiceStatusAsync(int invoiceId);

        /// <summary>
        /// Calculates total paid amount for an invoice (sum of all payments).
        /// </summary>
        /// <param name="invoiceId">ID of the invoice</param>
        /// <returns>Total paid amount</returns>
        Task<decimal> GetTotalPaidAsync(int invoiceId);
    }

    /// <summary>
    /// Production implementation of IPaymentService with transaction and concurrency support.
    /// </summary>
    public class PaymentService : IPaymentService
    {
        private readonly RentalDbContext _context;
        private readonly ITransactionService _transactionService;
        private readonly INotificationService _notificationService;

        public PaymentService(RentalDbContext context, ITransactionService transactionService, INotificationService notificationService)
        {
            _context = context;
            _transactionService = transactionService;
            _notificationService = notificationService;
        }

        /// <inheritdoc />
        public async Task<Payment> RecordPaymentAsync(int invoiceId, decimal amount, PaymentMethod method)
        {
            if (amount <= 0)
            {
                throw new ArgumentException("Payment amount must be greater than zero.", nameof(amount));
            }

            // Execute in transaction with serializable isolation to prevent race conditions
            return await _transactionService.ExecuteInTransactionAsync(
                async () =>
                {
                    // Fetch invoice with concurrency token (RowVersion)
                    var invoice = await _context.Invoices
                        .FirstOrDefaultAsync(i => i.Id == invoiceId);

                    if (invoice == null)
                    {
                        throw new InvalidOperationException($"Invoice with ID {invoiceId} not found.");
                    }

                    // Calculate remaining balance
                    var totalPaid = await GetTotalPaidAsync(invoiceId);
                    var remainingBalance = invoice.TotalAmount - totalPaid;

                    // Validate payment doesn't exceed remaining balance
                    if (amount > remainingBalance)
                    {
                        throw new InvalidOperationException(
                            $"Payment amount {amount:C} exceeds remaining balance {remainingBalance:C}. " +
                            $"Invoice total: {invoice.TotalAmount:C}, Already paid: {totalPaid:C}");
                    }

                    // Create payment record
                    var payment = new Payment
                    {
                        InvoiceId = invoiceId,
                        Amount = amount,
                        Date = DateTime.UtcNow,
                        Method = method,
                        IsVerified = true // Staff recording is verified by default
                    };

                    _context.Payments.Add(payment);

                    // Update invoice status based on new total
                    await UpdateInvoiceStatusAsync(invoiceId);

                    // Save changes - will throw DbUpdateConcurrencyException if RowVersion doesn't match
                    try
                    {
                        await _context.SaveChangesAsync();
                    }
                    catch (DbUpdateConcurrencyException ex)
                    {
                        // Another process modified the invoice while we were processing this payment
                        throw new InvalidOperationException(
                            "Invoice was modified by another process. Please retry the payment.", ex);
                    }

                    // Trigger notification
                    await _notificationService.CreateNotificationAsync(
                        payment.OrganizationId,
                        "Payment Received",
                        $"Received {payment.Amount:C} for Invoice #{payment.InvoiceId}",
                        NotificationType.Success,
                        $"/invoices?id={payment.InvoiceId}"
                    );

                    return payment;
                },
                System.Data.IsolationLevel.Serializable);
        }

        /// <inheritdoc />
        public async Task<decimal> GetRemainingBalanceAsync(int invoiceId)
        {
            var invoice = await _context.Invoices
                .AsNoTracking()
                .FirstOrDefaultAsync(i => i.Id == invoiceId);

            if (invoice == null)
            {
                throw new InvalidOperationException($"Invoice with ID {invoiceId} not found.");
            }

            var totalPaid = await GetTotalPaidAsync(invoiceId);
            return invoice.TotalAmount - totalPaid;
        }

        /// <inheritdoc />
        public async Task UpdateInvoiceStatusAsync(int invoiceId)
        {
            var invoice = await _context.Invoices
                .FirstOrDefaultAsync(i => i.Id == invoiceId);

            if (invoice == null)
            {
                return;
            }

            var totalPaid = await GetTotalPaidAsync(invoiceId);
            var remainingBalance = invoice.TotalAmount - totalPaid;

            // Update status based on payment coverage
            if (remainingBalance <= 0)
            {
                invoice.Status = InvoiceStatus.Paid;
            }
            else if (totalPaid > 0)
            {
                invoice.Status = InvoiceStatus.Partial;
            }
            else
            {
                invoice.Status = InvoiceStatus.Unpaid;
            }

            _context.Invoices.Update(invoice);
        }

        /// <inheritdoc />
        public async Task<decimal> GetTotalPaidAsync(int invoiceId)
        {
            return await _context.Payments
                .AsNoTracking()
                .Where(p => p.InvoiceId == invoiceId && p.IsVerified)
                .SumAsync(p => p.Amount);
        }
    }
}
