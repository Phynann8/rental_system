using System.ComponentModel.DataAnnotations;

namespace RentalSystem.Web.Security;

public sealed class UserSession
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid UserAccountId { get; set; }

    public UserAccount? UserAccount { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public DateTime LastSeenAtUtc { get; set; } = DateTime.UtcNow;

    public DateTime ExpiresAtUtc { get; set; }

    public DateTime? RevokedAtUtc { get; set; }

    [StringLength(200)]
    public string? RevokedReason { get; set; }

    [StringLength(45)]
    public string? IpAddress { get; set; }

    [StringLength(512)]
    public string? UserAgent { get; set; }
}
