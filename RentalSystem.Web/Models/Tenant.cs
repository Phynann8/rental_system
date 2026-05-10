using System.ComponentModel.DataAnnotations;
using RentalSystem.Web.Data;

namespace RentalSystem.Web.Models
{
    public class Tenant : ISaasScoped
    {
        public int Id { get; set; }
        public int OrganizationId { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [StringLength(20)]
        public string? Phone { get; set; }

        [StringLength(50)]
        public string? NationalId { get; set; } // ID Card Number

        [StringLength(200)]
        public string? Hometown { get; set; } // Address/Details

        // Navigation
        public ICollection<Contract> Contracts { get; set; } = new List<Contract>();
        public ICollection<TenantDocument> Documents { get; set; } = new List<TenantDocument>();
    }
}
