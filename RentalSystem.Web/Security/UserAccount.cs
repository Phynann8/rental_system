using System.ComponentModel.DataAnnotations;
using RentalSystem.Web.Data;
using RentalSystem.Web.Models;

namespace RentalSystem.Web.Security;

public sealed class UserAccount : ISaasScoped
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public int OrganizationId { get; set; }
    public Organization? Organization { get; set; }
    public int? TenantId { get; set; }
    public Tenant? Tenant { get; set; }

    [Required]
    [StringLength(50)]
    public string Username { get; set; } = string.Empty;

    [Required]
    [StringLength(50)]
    public string NormalizedUsername { get; set; } = string.Empty;

    [Required]
    [StringLength(256)]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [StringLength(256)]
    public string NormalizedEmail { get; set; } = string.Empty;

    [Required]
    [StringLength(100)]
    public string DisplayName { get; set; } = string.Empty;

    [Required]
    [StringLength(20)]
    public string Role { get; set; } = AppRoles.Manager;

    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;

    public int AccessFailedCount { get; set; }

    public DateTime? LockoutEndUtc { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

    public DateTime? LastLoginAtUtc { get; set; }

    public DateTime? LastPasswordChangeAtUtc { get; set; }

    public Guid? SetupToken { get; set; }
    public DateTime? SetupTokenExpiresAtUtc { get; set; }

    public ICollection<UserSession> Sessions { get; set; } = new List<UserSession>();
}
