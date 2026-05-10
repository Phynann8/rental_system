using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using RentalSystem.Web.Data;

namespace RentalSystem.Web.Models
{
    public class Building : ISaasScoped
    {
        public int Id { get; set; }
        public int OrganizationId { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [StringLength(200)]
        public string? Address { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal WaterUnitPrice { get; set; } = 0.50m; // Default $0.50

        [Column(TypeName = "decimal(18,2)")]
        public decimal ElectricUnitPrice { get; set; } = 0.25m; // Default $0.25

        // Navigation Property: A building has many rooms
        public ICollection<Room> Rooms { get; set; } = new List<Room>();
    }
}
