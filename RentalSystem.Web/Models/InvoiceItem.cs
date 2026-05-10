using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using RentalSystem.Web.Data;

namespace RentalSystem.Web.Models
{
    public class InvoiceItem : ISaasScoped
    {
        public int Id { get; set; }
        public int OrganizationId { get; set; }
        public int InvoiceId { get; set; }
        public Invoice? Invoice { get; set; }

        [Required]
        [StringLength(100)]
        public string Description { get; set; } = string.Empty; // e.g. "Rent June", "Water (10 units)"

        public double Quantity { get; set; } = 1;

        [Column(TypeName = "decimal(18,2)")]
        public decimal UnitPrice { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Total { get; set; }
    }
}
