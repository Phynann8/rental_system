using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using RentalSystem.Web.Data;

namespace RentalSystem.Web.Models
{
    public enum PaymentMethod
    {
        Cash,
        BankTransfer,
        QRCode
    }

    public class Payment : ISaasScoped
    {
        public int Id { get; set; }
        public int OrganizationId { get; set; }
        public int InvoiceId { get; set; }
        public Invoice? Invoice { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        public DateTime Date { get; set; }

        public PaymentMethod Method { get; set; }

        public bool IsVerified { get; set; } = true;

        [StringLength(500)]
        public string? ReceiptPath { get; set; }

        [StringLength(1000)]
        public string? TenantNotes { get; set; }

        [StringLength(1000)]
        public string? VerificationNotes { get; set; }

        /// <summary>
        /// Concurrency token for optimistic locking during record updates.
        /// Prevents lost updates if the same payment is modified concurrently.
        /// </summary>
        [Timestamp]
        public byte[]? RowVersion { get; set; }
    }
}
