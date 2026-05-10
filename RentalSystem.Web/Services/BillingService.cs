using Microsoft.EntityFrameworkCore;
using RentalSystem.Web.Data;
using RentalSystem.Web.Models;

namespace RentalSystem.Web.Services;

/// <summary>
/// Defines the SaaS billing operations for subscription management, plan changes, and payment processing.
/// </summary>
public interface IBillingService
{
    Task<BillingOverviewDto> GetBillingOverviewAsync(int organizationId, CancellationToken ct = default);
    Task<IReadOnlyList<BillingTransactionDto>> GetBillingHistoryAsync(int organizationId, CancellationToken ct = default);
    Task<PlanChangeResult> ChangePlanAsync(int organizationId, SubscriptionTier newTier, string? testCardNumber, CancellationToken ct = default);
    Task<PaymentResult> SimulatePaymentAsync(int organizationId, string? testCardNumber, CancellationToken ct = default);
    Task<PlanChangeResult> CancelSubscriptionAsync(int organizationId, CancellationToken ct = default);
}

/// <summary>
/// Mock-first billing service that simulates a payment gateway using "test card numbers"
/// to control success/failure outcomes. All state is persisted to the database.
/// 
/// Test Card Reference:
///   4242424242424242 → Always succeeds
///   4000000000000002 → Always declines
///   4000000000009995 → Insufficient funds
///   (any other)      → Succeeds by default
/// </summary>
public class MockBillingService : IBillingService
{
    private readonly RentalDbContext _context;
    private readonly ILogger<MockBillingService> _logger;

    private static readonly Dictionary<SubscriptionTier, PlanDefinition> Plans = new()
    {
        [SubscriptionTier.Free] = new("Free", 0m, 1, 5, 50, false, false),
        [SubscriptionTier.Basic] = new("Basic", 19.99m, 3, 25, 500, true, false),
        [SubscriptionTier.Pro] = new("Pro", 49.99m, 10, 100, 2000, true, true),
        [SubscriptionTier.Enterprise] = new("Enterprise", 149.99m, -1, -1, -1, true, true), // -1 = unlimited
    };

    public MockBillingService(RentalDbContext context, ILogger<MockBillingService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<BillingOverviewDto> GetBillingOverviewAsync(int organizationId, CancellationToken ct = default)
    {
        var subscription = await _context.Subscriptions
            .FirstOrDefaultAsync(s => s.OrganizationId == organizationId, ct);

        if (subscription == null)
        {
            return new BillingOverviewDto(
                CurrentPlan: Plans[SubscriptionTier.Free].Name,
                Tier: SubscriptionTier.Free,
                Status: SubscriptionStatus.Active,
                MonthlyPrice: 0m,
                StartDate: DateTime.UtcNow,
                TrialEndsAt: null,
                NextBillingDate: null,
                IsTrialing: false,
                DaysLeftInTrial: 0,
                AvailablePlans: GetAvailablePlans(),
                CurrentPlanLimits: Plans[SubscriptionTier.Free]);
        }

        var isTrialing = subscription.TrialEndsUtc.HasValue && subscription.TrialEndsUtc > DateTime.UtcNow;
        var daysLeft = isTrialing
            ? (int)(subscription.TrialEndsUtc!.Value - DateTime.UtcNow).TotalDays
            : 0;

        // Next billing date: either trial end or 1 month from start
        DateTime? nextBilling = null;
        if (subscription.Status == SubscriptionStatus.Active && subscription.Tier != SubscriptionTier.Free)
        {
            nextBilling = isTrialing
                ? subscription.TrialEndsUtc
                : subscription.StartDateUtc.AddMonths(
                    (int)Math.Ceiling((DateTime.UtcNow - subscription.StartDateUtc).TotalDays / 30) + 1);
        }

        return new BillingOverviewDto(
            CurrentPlan: Plans[subscription.Tier].Name,
            Tier: subscription.Tier,
            Status: subscription.Status,
            MonthlyPrice: subscription.MonthlyPrice,
            StartDate: subscription.StartDateUtc,
            TrialEndsAt: subscription.TrialEndsUtc,
            NextBillingDate: nextBilling,
            IsTrialing: isTrialing,
            DaysLeftInTrial: daysLeft,
            AvailablePlans: GetAvailablePlans(),
            CurrentPlanLimits: Plans[subscription.Tier]);
    }

    public async Task<IReadOnlyList<BillingTransactionDto>> GetBillingHistoryAsync(int organizationId, CancellationToken ct = default)
    {
        return await _context.BillingTransactions
            .Where(bt => bt.OrganizationId == organizationId)
            .OrderByDescending(bt => bt.CreatedAtUtc)
            .Take(50)
            .Select(bt => new BillingTransactionDto(
                bt.Id,
                bt.Type,
                bt.Status,
                bt.Amount,
                bt.Description,
                bt.CardLast4,
                bt.GatewayReference,
                bt.FailureReason,
                bt.CreatedAtUtc))
            .ToListAsync(ct);
    }

    public async Task<PlanChangeResult> ChangePlanAsync(int organizationId, SubscriptionTier newTier, string? testCardNumber, CancellationToken ct = default)
    {
        var subscription = await _context.Subscriptions
            .FirstOrDefaultAsync(s => s.OrganizationId == organizationId, ct);

        if (subscription == null)
            return PlanChangeResult.Fail("No active subscription found.");

        if (subscription.Tier == newTier)
            return PlanChangeResult.Fail("You are already on this plan.");

        var planDef = Plans[newTier];
        var isUpgrade = newTier > subscription.Tier;
        var now = DateTime.UtcNow;

        // If upgrading to a paid plan, simulate payment
        if (newTier != SubscriptionTier.Free && planDef.Price > 0)
        {
            var paymentOutcome = SimulateGateway(testCardNumber, planDef.Price);

            var transaction = new BillingTransaction
            {
                OrganizationId = organizationId,
                Type = isUpgrade ? BillingTransactionType.PlanUpgrade : BillingTransactionType.PlanDowngrade,
                Status = paymentOutcome.Succeeded ? BillingTransactionStatus.Succeeded : BillingTransactionStatus.Failed,
                Amount = planDef.Price,
                Description = $"{(isUpgrade ? "Upgrade" : "Downgrade")} to {planDef.Name} plan",
                CardLast4 = paymentOutcome.CardLast4,
                GatewayReference = paymentOutcome.TransactionId,
                FailureReason = paymentOutcome.ErrorMessage,
                CreatedAtUtc = now
            };
            _context.BillingTransactions.Add(transaction);

            if (!paymentOutcome.Succeeded)
            {
                await _context.SaveChangesAsync(ct);
                _logger.LogWarning("MOCK BILLING: Plan change failed for Org {OrgId} → {Reason}", organizationId, paymentOutcome.ErrorMessage);
                return PlanChangeResult.Fail($"Payment declined: {paymentOutcome.ErrorMessage}");
            }
        }
        else
        {
            // Downgrade to free
            _context.BillingTransactions.Add(new BillingTransaction
            {
                OrganizationId = organizationId,
                Type = BillingTransactionType.PlanDowngrade,
                Status = BillingTransactionStatus.Succeeded,
                Amount = 0m,
                Description = "Downgrade to Free plan",
                CreatedAtUtc = now
            });
        }

        // Apply plan change
        subscription.Tier = newTier;
        subscription.MonthlyPrice = planDef.Price;
        subscription.Status = SubscriptionStatus.Active;
        subscription.UpdatedAtUtc = now;

        // Clear trial if switching plans
        if (subscription.TrialEndsUtc.HasValue)
            subscription.TrialEndsUtc = null;

        await _context.SaveChangesAsync(ct);

        _logger.LogInformation("MOCK BILLING: Org {OrgId} changed plan to {Plan}", organizationId, planDef.Name);
        return PlanChangeResult.Ok($"Successfully changed to {planDef.Name} plan.");
    }

    public async Task<PaymentResult> SimulatePaymentAsync(int organizationId, string? testCardNumber, CancellationToken ct = default)
    {
        var subscription = await _context.Subscriptions
            .FirstOrDefaultAsync(s => s.OrganizationId == organizationId, ct);

        if (subscription == null || subscription.MonthlyPrice <= 0)
            return PaymentResult.Fail("No billable subscription found.");

        var paymentOutcome = SimulateGateway(testCardNumber, subscription.MonthlyPrice);
        var now = DateTime.UtcNow;

        var transaction = new BillingTransaction
        {
            OrganizationId = organizationId,
            Type = BillingTransactionType.SubscriptionPayment,
            Status = paymentOutcome.Succeeded ? BillingTransactionStatus.Succeeded : BillingTransactionStatus.Failed,
            Amount = subscription.MonthlyPrice,
            Description = $"Monthly payment – {Plans[subscription.Tier].Name} plan",
            CardLast4 = paymentOutcome.CardLast4,
            GatewayReference = paymentOutcome.TransactionId,
            FailureReason = paymentOutcome.ErrorMessage,
            CreatedAtUtc = now
        };
        _context.BillingTransactions.Add(transaction);

        if (paymentOutcome.Succeeded)
        {
            subscription.Status = SubscriptionStatus.Active;
            subscription.UpdatedAtUtc = now;
        }
        else
        {
            subscription.Status = SubscriptionStatus.PastDue;
            subscription.UpdatedAtUtc = now;
        }

        await _context.SaveChangesAsync(ct);

        _logger.LogInformation("MOCK BILLING: Payment {Status} for Org {OrgId} – ${Amount}",
            paymentOutcome.Succeeded ? "succeeded" : "failed", organizationId, subscription.MonthlyPrice);

        return paymentOutcome.Succeeded
            ? PaymentResult.Ok(paymentOutcome.TransactionId!, paymentOutcome.CardLast4!)
            : PaymentResult.Fail($"Payment declined: {paymentOutcome.ErrorMessage}");
    }

    public async Task<PlanChangeResult> CancelSubscriptionAsync(int organizationId, CancellationToken ct = default)
    {
        var subscription = await _context.Subscriptions
            .FirstOrDefaultAsync(s => s.OrganizationId == organizationId, ct);

        if (subscription == null)
            return PlanChangeResult.Fail("No active subscription found.");

        if (subscription.Status == SubscriptionStatus.Canceled)
            return PlanChangeResult.Fail("Subscription is already canceled.");

        subscription.Status = SubscriptionStatus.Canceled;
        subscription.EndDateUtc = DateTime.UtcNow;
        subscription.UpdatedAtUtc = DateTime.UtcNow;

        _context.BillingTransactions.Add(new BillingTransaction
        {
            OrganizationId = organizationId,
            Type = BillingTransactionType.PlanDowngrade,
            Status = BillingTransactionStatus.Succeeded,
            Amount = 0m,
            Description = "Subscription canceled",
            CreatedAtUtc = DateTime.UtcNow
        });

        await _context.SaveChangesAsync(ct);

        _logger.LogInformation("MOCK BILLING: Subscription canceled for Org {OrgId}", organizationId);
        return PlanChangeResult.Ok("Subscription has been canceled.");
    }

    // ────────────────────────────────────────────
    // Mock Payment Gateway Simulation
    // ────────────────────────────────────────────

    private static GatewayOutcome SimulateGateway(string? cardNumber, decimal amount)
    {
        var cleanCard = cardNumber?.Replace(" ", "").Replace("-", "") ?? "4242424242424242";
        var last4 = cleanCard.Length >= 4 ? cleanCard[^4..] : "0000";
        var txnId = $"mock_txn_{Guid.NewGuid():N}"[..24];

        return cleanCard switch
        {
            "4000000000000002" => new GatewayOutcome(false, last4, txnId, "Card declined by issuer."),
            "4000000000009995" => new GatewayOutcome(false, last4, txnId, "Insufficient funds."),
            "4000000000000069" => new GatewayOutcome(false, last4, txnId, "Card expired."),
            "4000000000000127" => new GatewayOutcome(false, last4, txnId, "Incorrect CVC."),
            _ => new GatewayOutcome(true, last4, txnId, null)
        };
    }

    private static List<PlanOptionDto> GetAvailablePlans()
    {
        return Plans.Select(kv => new PlanOptionDto(
            kv.Key,
            kv.Value.Name,
            kv.Value.Price,
            kv.Value.MaxBuildings == -1 ? "Unlimited" : kv.Value.MaxBuildings.ToString(),
            kv.Value.MaxRooms == -1 ? "Unlimited" : kv.Value.MaxRooms.ToString(),
            kv.Value.MaxTenants == -1 ? "Unlimited" : kv.Value.MaxTenants.ToString(),
            kv.Value.PdfExport,
            kv.Value.AiInsights
        )).ToList();
    }

    private record GatewayOutcome(bool Succeeded, string CardLast4, string TransactionId, string? ErrorMessage);
}

// ────────────────────────────────────────────
// DTOs
// ────────────────────────────────────────────

public record PlanDefinition(
    string Name,
    decimal Price,
    int MaxBuildings,
    int MaxRooms,
    int MaxTenants,
    bool PdfExport,
    bool AiInsights);

public record BillingOverviewDto(
    string CurrentPlan,
    SubscriptionTier Tier,
    SubscriptionStatus Status,
    decimal MonthlyPrice,
    DateTime StartDate,
    DateTime? TrialEndsAt,
    DateTime? NextBillingDate,
    bool IsTrialing,
    int DaysLeftInTrial,
    List<PlanOptionDto> AvailablePlans,
    PlanDefinition CurrentPlanLimits);

public record PlanOptionDto(
    SubscriptionTier Tier,
    string Name,
    decimal Price,
    string MaxBuildings,
    string MaxRooms,
    string MaxTenants,
    bool PdfExport,
    bool AiInsights);

public record BillingTransactionDto(
    int Id,
    BillingTransactionType Type,
    BillingTransactionStatus Status,
    decimal Amount,
    string Description,
    string? CardLast4,
    string? GatewayReference,
    string? FailureReason,
    DateTime CreatedAtUtc);

public record PlanChangeResult(bool Succeeded, string Message)
{
    public static PlanChangeResult Ok(string message) => new(true, message);
    public static PlanChangeResult Fail(string message) => new(false, message);
}

public record PaymentResult(bool Succeeded, string Message, string? TransactionId = null, string? CardLast4 = null)
{
    public static PaymentResult Ok(string transactionId, string cardLast4)
        => new(true, "Payment succeeded.", transactionId, cardLast4);
    public static PaymentResult Fail(string message)
        => new(false, message);
}
