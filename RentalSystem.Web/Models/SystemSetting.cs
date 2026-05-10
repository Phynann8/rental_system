using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using RentalSystem.Web.Data;

namespace RentalSystem.Web.Models
{
    public class SystemSetting : ISaasScoped
    {
        public int Id { get; set; }
        public int OrganizationId { get; set; }

        [Required]
        [StringLength(200)]
        public string CompanyName { get; set; } = "RentalMgr";

        [Required]
        [StringLength(10)]
        public string CurrencySymbol { get; set; } = "$";

        public int DefaultInvoiceDueDays { get; set; } = 7;

        [Column(TypeName = "decimal(18,2)")]
        public decimal DefaultElectricityRate { get; set; } = 1000m;

        [Column(TypeName = "decimal(18,2)")]
        public decimal DefaultWaterRate { get; set; } = 1500m;

        [Column(TypeName = "decimal(18,2)")]
        public decimal ExchangeRateUsdToKhr { get; set; } = 4100m;

        [StringLength(200)]
        public string? AddressLine1 { get; set; }

        [StringLength(200)]
        public string? AddressLine2 { get; set; }

        [StringLength(1000)]
        public string? PaymentInstructions { get; set; }
    }
}
