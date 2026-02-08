using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RentalSystem.Web.Models
{
    public enum InvoiceStatus
    {
        Unpaid,
        Partial,
        Paid
    }

    public class Invoice
    {
        public int Id { get; set; }

        public int ContractId { get; set; }
        public Contract? Contract { get; set; }

        public DateTime Date { get; set; }
        public DateTime DueDate { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAmount { get; set; }

        public InvoiceStatus Status { get; set; } = InvoiceStatus.Unpaid;

        // Navigation
        public ICollection<InvoiceItem> Items { get; set; } = new List<InvoiceItem>();
        public ICollection<Payment> Payments { get; set; } = new List<Payment>();
    }
}
