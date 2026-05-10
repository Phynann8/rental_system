using System.ComponentModel.DataAnnotations;
using RentalSystem.Web.Data;

namespace RentalSystem.Web.Models;

public enum MaintenanceStatus
{
    Open,
    InProgress,
    Resolved,
    Cancelled
}

public enum MaintenancePriority
{
    Low,
    Medium,
    High,
    Critical
}

public class MaintenanceTicket : ISaasScoped
{
    [Key]
    public int Id { get; set; }

    public int OrganizationId { get; set; }

    [Required]
    public int RoomId { get; set; }
    public Room? Room { get; set; }

    public int? TenantId { get; set; }
    // Navigation property if you want to link strictly to Tenant
    public Tenant? Tenant { get; set; }

    [Required]
    [StringLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [StringLength(2000)]
    public string Description { get; set; } = string.Empty;

    public MaintenanceStatus Status { get; set; } = MaintenanceStatus.Open;

    public MaintenancePriority Priority { get; set; } = MaintenancePriority.Medium;

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public DateTime? ResolvedAtUtc { get; set; }

    [StringLength(100)]
    public string? AssignedTo { get; set; }

    [StringLength(2000)]
    public string? ResolutionNotes { get; set; }
}
