using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using RentalSystem.Web.Data;

namespace RentalSystem.Web.Models;

public enum NotificationType
{
    Info,
    Warning,
    Success,
    Error
}

public class Notification : ISaasScoped
{
    [Key]
    public int Id { get; set; }

    public int OrganizationId { get; set; }

    [Required]
    [StringLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [StringLength(1000)]
    public string Message { get; set; } = string.Empty;

    public NotificationType Type { get; set; } = NotificationType.Info;

    public bool IsRead { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    [StringLength(500)]
    public string? LinkUri { get; set; }
}
