using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RentalSystem.Web.Models.Dtos;
using RentalSystem.Web.Security;
using RentalSystem.Web.Services;

namespace RentalSystem.Web.Controllers;

[ApiController]
[Authorize(Policy = AuthorizationPolicies.TenantOnly)]
[Route("api/portal")]
public sealed class TenantPortalController : ControllerBase
{
    private readonly ITenantPortalService _portalService;

    public TenantPortalController(ITenantPortalService portalService)
    {
        _portalService = portalService;
    }

    [HttpGet("dashboard")]
    public async Task<ActionResult<TenantDashboardDto>> GetDashboard()
    {
        var dashboard = await _portalService.GetDashboardAsync(User);
        if (dashboard == null) return Unauthorized();

        return Ok(dashboard);
    }

    [HttpGet("invoices")]
    public async Task<ActionResult<List<TenantInvoiceDto>>> GetInvoices()
    {
        var invoices = await _portalService.GetInvoicesAsync(User);
        if (invoices == null) return Unauthorized();

        return Ok(invoices);
    }

    [HttpPost("payments")]
    public async Task<ActionResult> SubmitPayment([FromForm] TenantPaymentRequest request)
    {
        var result = await _portalService.SubmitPaymentAsync(User, request);
        if (!result.Success)
        {
            if (result.Message == "Unauthorized") return Unauthorized();
            return NotFound(result.Message);
        }

        return Ok(new { message = result.Message });
    }
}
