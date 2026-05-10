using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RentalSystem.Web.Models.Dtos;
using RentalSystem.Web.Security;
using RentalSystem.Web.Services;

namespace RentalSystem.Web.Controllers;

[ApiController]
[Authorize(Policy = AuthorizationPolicies.PropertyManagement)]
[Route("api/maintenance")]
public sealed class MaintenanceController : ControllerBase
{
    private readonly IMaintenanceService _maintenanceService;

    public MaintenanceController(IMaintenanceService maintenanceService)
    {
        _maintenanceService = maintenanceService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<MaintenanceTicketDto>>> GetTickets(
        [FromQuery] int? buildingId,
        [FromQuery] string? status)
    {
        return Ok(await _maintenanceService.GetTicketsAsync(buildingId, status));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<MaintenanceTicketDto>> GetTicket(int id)
    {
        var ticket = await _maintenanceService.GetTicketAsync(id);
        if (ticket == null) return NotFound();

        return Ok(ticket);
    }

    [HttpPost]
    public async Task<ActionResult<MaintenanceTicketDto>> CreateTicket([FromBody] UpsertMaintenanceRequest request)
    {
        try
        {
            var ticket = await _maintenanceService.CreateTicketAsync(request);
            return CreatedAtAction(nameof(GetTicket), new { id = ticket.Id }, ticket);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<MaintenanceTicketDto>> UpdateTicket(int id, [FromBody] UpdateMaintenanceRequest request)
    {
        var ticket = await _maintenanceService.UpdateTicketAsync(id, request);
        if (ticket == null) return NotFound();

        return Ok(ticket);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteTicket(int id)
    {
        var success = await _maintenanceService.DeleteTicketAsync(id);
        if (!success) return NotFound();

        return NoContent();
    }
}
