using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using RentalSystem.Web.Data;

namespace RentalSystem.Web.Models;

public enum BillingTransactionType
{
    SubscriptionPayment,
    PlanUpgrade,
    PlanDowngrade,
    Refund,
    TrialStart
}

public enum BillingTransactionStatus
{
    Succeeded,
    Failed,
    Pending,
    Refunded
}

public class BillingTransaction : ISaasScoped
{
    public int Id { get; set; }
    public int OrganizationId { get; set; }
    public Organization? Organization { get; set; }

    [Required]
    public BillingTransactionType Type { get; set; }

    [Required]
    public BillingTransactionStatus Status { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Amount { get; set; }

    [StringLength(100)]
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Simulated card last-4 digits for mock gateway display.
    /// </summary>
    [StringLength(4)]
    public string? CardLast4 { get; set; }

    /// <summary>
    /// Simulated gateway transaction reference.
    /// </summary>
    [StringLength(50)]
    public string? GatewayReference { get; set; }

    /// <summary>
    /// Error message from the mock gateway when payment fails.
    /// </summary>
    [StringLength(500)]
    public string? FailureReason { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
