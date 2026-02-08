using System.ComponentModel.DataAnnotations;

namespace RentalSystem.Web.Models
{
    public class Tenant
    {
        public int Id { get; set; }

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
    }
}
