using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RentalSystem.Web.Models.Dtos;
using RentalSystem.Web.Security;
using RentalSystem.Web.Services;

namespace RentalSystem.Web.Controllers;

[ApiController]
[Authorize(Policy = AuthorizationPolicies.DashboardRead)]
[Route("api/dashboard")]
public sealed class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    [HttpGet]
    public async Task<ActionResult<DashboardResponse>> GetDashboard()
    {
        return Ok(await _dashboardService.GetDashboardAsync());
    }

    [HttpGet("buildings")]
    public async Task<ActionResult<IReadOnlyList<BuildingComparisonDto>>> GetBuildingComparisons()
    {
        return Ok(await _dashboardService.GetBuildingComparisonsAsync());
    }
}

