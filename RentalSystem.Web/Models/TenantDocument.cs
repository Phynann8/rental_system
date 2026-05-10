using System.ComponentModel.DataAnnotations;
using RentalSystem.Web.Data;

namespace RentalSystem.Web.Models
{
    public class TenantDocument : ISaasScoped
    {
        public int Id { get; set; }
        public int OrganizationId { get; set; }

        public int TenantId { get; set; }

        [Required]
        [StringLength(100)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string DocumentType { get; set; } = "IDScan"; // IDScan, Contract, Registration, etc.

        [Required]
        [StringLength(500)]
        public string FilePath { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string ContentType { get; set; } = string.Empty;

        public long FileSize { get; set; }

        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public Tenant? Tenant { get; set; }
    }
}
