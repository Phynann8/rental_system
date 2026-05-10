using System.ComponentModel.DataAnnotations;

namespace RentalSystem.Web.Models
{
    public class Organization
    {
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [StringLength(20)]
        public string SubscriptionTier { get; set; } = "Standard"; // Standard, Premium, Enterprise

        public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

        public bool IsActive { get; set; } = true;
    }
}
