using System.ComponentModel.DataAnnotations;
using RentalSystem.Web.Data;

namespace RentalSystem.Web.Models;

public class AuditLog : ISaasScoped
{
    [Key]
    public int Id { get; set; }

    public int OrganizationId { get; set; }

    [StringLength(50)]
    public string? UserId { get; set; }

    [StringLength(100)]
    public string? Username { get; set; }

    [Required]
    [StringLength(20)]
    public string Action { get; set; } = string.Empty; // Create, Update, Delete

    [Required]
    [StringLength(100)]
    public string EntityName { get; set; } = string.Empty;

    [Required]
    [StringLength(100)]
    public string EntityId { get; set; } = string.Empty;

    public string? OldValues { get; set; } // Stored as JSON

    public string? NewValues { get; set; } // Stored as JSON

    [StringLength(50)]
    public string? IpAddress { get; set; }

    public DateTime TimestampUtc { get; set; } = DateTime.UtcNow;
}
