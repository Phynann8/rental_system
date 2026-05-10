using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using RentalSystem.Web.Data;

namespace RentalSystem.Web.Models
{
    public class RoomType : ISaasScoped
    {
        public int Id { get; set; }
        public int OrganizationId { get; set; }

        [Required]
        [StringLength(50)]
        public string Name { get; set; } = string.Empty; // e.g., "Standard", "VIP"

        [StringLength(500)]
        public string? Description { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal BasePrice { get; set; }

        // Navigation Property
        public ICollection<Room> Rooms { get; set; } = new List<Room>();
    }
}
