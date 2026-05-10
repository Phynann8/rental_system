using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using RentalSystem.Web.Data;

namespace RentalSystem.Web.Models
{
    public enum InvoiceStatus
    {
        Unpaid,
        Partial,
        Paid
    }

    public class Invoice : ISaasScoped
    {
        public int Id { get; set; }
        public int OrganizationId { get; set; }

        public int ContractId { get; set; }
        public Contract? Contract { get; set; }

        public DateTime Date { get; set; }
        public DateTime DueDate { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAmount { get; set; }

        public InvoiceStatus Status { get; set; } = InvoiceStatus.Unpaid;

        /// <summary>
        /// Idempotency key to prevent duplicate invoice generation.
        /// Format: "{ContractId}_{YYYYMM}" e.g., "42_202604"
        /// Unique constraint enforced at database level.
        /// </summary>
        [StringLength(20)]
        public string? InvoiceKey { get; set; }

        /// <summary>
        /// Concurrency token for optimistic locking during payment processing.
        /// Prevents race conditions when multiple payments update the same invoice.
        /// </summary>
        [Timestamp]
        public byte[]? RowVersion { get; set; }

        // Navigation
        public ICollection<InvoiceItem> Items { get; set; } = new List<InvoiceItem>();
        public ICollection<Payment> Payments { get; set; } = new List<Payment>();

        [NotMapped]
        public decimal PaidAmount => Payments?.Sum(p => p.Amount) ?? 0m;

        [NotMapped]
        public decimal Balance => TotalAmount - PaidAmount;
    }
}
