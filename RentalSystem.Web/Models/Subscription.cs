using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using RentalSystem.Web.Data;

namespace RentalSystem.Web.Models;

public enum SubscriptionTier
{
    Free,
    Basic,
    Pro,
    Enterprise
}

public enum SubscriptionStatus
{
    Active,
    PastDue,
    Canceled,
    Trialing
}

public class Subscription : ISaasScoped
{
    public int Id { get; set; }
    public int OrganizationId { get; set; }
    public Organization? Organization { get; set; }

    [Required]
    public SubscriptionTier Tier { get; set; }

    [Required]
    public SubscriptionStatus Status { get; set; }

    [Required]
    public DateTime StartDateUtc { get; set; }

    public DateTime? EndDateUtc { get; set; }

    public DateTime? TrialEndsUtc { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal MonthlyPrice { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
}
