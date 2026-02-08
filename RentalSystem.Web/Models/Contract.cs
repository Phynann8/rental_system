using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RentalSystem.Web.Models
{
    public enum ContractStatus
    {
        Active,
        Ended,
        Terminated
    }

    public class Contract
    {
        public int Id { get; set; }

        public int TenantId { get; set; }
        public Tenant? Tenant { get; set; }

        public int RoomId { get; set; }
        public Room? Room { get; set; }

        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal RentPrice { get; set; } // Can override RoomType base price

        [Column(TypeName = "decimal(18,2)")]
        public decimal DepositAmount { get; set; }

        public ContractStatus Status { get; set; } = ContractStatus.Active;

        // Navigation
        public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
    }
}
