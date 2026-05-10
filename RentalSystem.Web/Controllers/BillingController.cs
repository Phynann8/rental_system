using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RentalSystem.Web.Models;
using RentalSystem.Web.Security;
using RentalSystem.Web.Services;

namespace RentalSystem.Web.Controllers;

[ApiController]
[Route("api/billing")]
[Authorize]
public sealed class BillingController : ControllerBase
{
    private readonly IBillingService _billingService;

    public BillingController(IBillingService billingService)
    {
        _billingService = billingService;
    }

    private int? GetOrganizationId()
    {
        var claim = User.FindFirst(AuthClaimTypes.OrganizationId)?.Value;
        return int.TryParse(claim, out var id) ? id : null;
    }

    /// <summary>
    /// Returns the current billing overview: active plan, trial status, limits, and available plans.
    /// </summary>
    [HttpGet("overview")]
    public async Task<ActionResult<BillingOverviewDto>> GetOverview(CancellationToken ct)
    {
        var orgId = GetOrganizationId();
        if (orgId == null) return Unauthorized(new { message = "Organization context missing." });

        return Ok(await _billingService.GetBillingOverviewAsync(orgId.Value, ct));
    }

    /// <summary>
    /// Returns the billing transaction history (last 50 transactions).
    /// </summary>
    [HttpGet("history")]
    public async Task<ActionResult<IReadOnlyList<BillingTransactionDto>>> GetHistory(CancellationToken ct)
    {
        var orgId = GetOrganizationId();
        if (orgId == null) return Unauthorized(new { message = "Organization context missing." });

        return Ok(await _billingService.GetBillingHistoryAsync(orgId.Value, ct));
    }

    /// <summary>
    /// Change the subscription plan. Simulates payment via mock gateway using test card numbers.
    /// </summary>
    [HttpPost("change-plan")]
    [Authorize(Policy = AuthorizationPolicies.PropertyManagement)]
    public async Task<IActionResult> ChangePlan([FromBody] ChangePlanRequest request, CancellationToken ct)
    {
        var orgId = GetOrganizationId();
        if (orgId == null) return Unauthorized(new { message = "Organization context missing." });

        var result = await _billingService.ChangePlanAsync(orgId.Value, request.NewTier, request.TestCardNumber, ct);
        if (!result.Succeeded)
            return BadRequest(new { message = result.Message });

        return Ok(new { message = result.Message });
    }

    /// <summary>
    /// Simulates a monthly subscription payment using a test card number.
    /// </summary>
    [HttpPost("pay")]
    [Authorize(Policy = AuthorizationPolicies.PropertyManagement)]
    public async Task<IActionResult> SimulatePayment([FromBody] SimulatePaymentRequest request, CancellationToken ct)
    {
        var orgId = GetOrganizationId();
        if (orgId == null) return Unauthorized(new { message = "Organization context missing." });

        var result = await _billingService.SimulatePaymentAsync(orgId.Value, request.TestCardNumber, ct);
        if (!result.Succeeded)
            return BadRequest(new { message = result.Message });

        return Ok(new { message = result.Message, transactionId = result.TransactionId, cardLast4 = result.CardLast4 });
    }

    /// <summary>
    /// Cancel the subscription.
    /// </summary>
    [HttpPost("cancel")]
    [Authorize(Policy = AuthorizationPolicies.PropertyManagement)]
    public async Task<IActionResult> CancelSubscription(CancellationToken ct)
    {
        var orgId = GetOrganizationId();
        if (orgId == null) return Unauthorized(new { message = "Organization context missing." });

        var result = await _billingService.CancelSubscriptionAsync(orgId.Value, ct);
        if (!result.Succeeded)
            return BadRequest(new { message = result.Message });

        return Ok(new { message = result.Message });
    }
}

public sealed class ChangePlanRequest
{
    public SubscriptionTier NewTier { get; set; }
    public string? TestCardNumber { get; set; }
}

public sealed class SimulatePaymentRequest
{
    public string? TestCardNumber { get; set; }
}
