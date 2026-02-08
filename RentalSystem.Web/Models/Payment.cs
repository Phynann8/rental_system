using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RentalSystem.Web.Models
{
    public enum PaymentMethod
    {
        Cash,
        BankTransfer,
        QRCode
    }

    public class Payment
    {
        public int Id { get; set; }

        public int InvoiceId { get; set; }
        public Invoice? Invoice { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        public DateTime Date { get; set; }

        public PaymentMethod Method { get; set; }
    }
}
