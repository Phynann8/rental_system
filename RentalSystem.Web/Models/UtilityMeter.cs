using System.ComponentModel.DataAnnotations;
using RentalSystem.Web.Data;

namespace RentalSystem.Web.Models
{
    public enum MeterType
    {
        Water,
        Electric
    }

    public class UtilityMeter : ISaasScoped
    {
        public int Id { get; set; }
        public int OrganizationId { get; set; }

        public int RoomId { get; set; }
        public Room? Room { get; set; }

        public MeterType Type { get; set; }

        public double CurrentReading { get; set; }
        
        public DateTime LastReadingDate { get; set; }
    }
}
