using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using RentalSystem.Web.Data;

namespace RentalSystem.Web.Models
{
    public enum RoomStatus
    {
        Vacant,
        Occupied,
        Maintenance
    }

    public class Room : ISaasScoped
    {
        public int Id { get; set; }
        public int OrganizationId { get; set; }

        public int BuildingId { get; set; }
        public Building? Building { get; set; }

        public int RoomTypeId { get; set; }
        public RoomType? RoomType { get; set; }

        [Required]
        [StringLength(20)]
        public string RoomNumber { get; set; } = string.Empty;

        public int Floor { get; set; }

        public RoomStatus Status { get; set; } = RoomStatus.Vacant;

        // Navigation Properties
        public ICollection<UtilityMeter> Meters { get; set; } = new List<UtilityMeter>();
        public ICollection<Contract> Contracts { get; set; } = new List<Contract>();
    }
}
