using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RentalSystem.Web.Models.Dtos;
using RentalSystem.Web.Security;
using RentalSystem.Web.Services;

namespace RentalSystem.Web.Controllers;

[ApiController]
[Authorize(Policy = AuthorizationPolicies.BillingOperations)]
[Route("api/reports")]
public sealed class ReportsController : ControllerBase
{
    private readonly IReportService _reportService;

    public ReportsController(IReportService reportService)
    {
        _reportService = reportService;
    }

    [HttpGet("revenue")]
    public async Task<ActionResult<RevenueReportResponse>> GetRevenue([FromQuery] int? year)
    {
        return Ok(await _reportService.GetRevenueReportAsync(year));
    }

    [HttpGet("occupancy")]
    public async Task<ActionResult<OccupancyReportResponse>> GetOccupancy()
    {
        return Ok(await _reportService.GetOccupancyReportAsync());
    }

    [HttpGet("outstanding")]
    public async Task<ActionResult<OutstandingReportResponse>> GetOutstanding()
    {
        return Ok(await _reportService.GetOutstandingReportAsync());
    }
}
