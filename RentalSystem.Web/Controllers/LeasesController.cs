using RentalSystem.Web.Models.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RentalSystem.Web.Data;
using RentalSystem.Web.Models;
using RentalSystem.Web.Security;
using RentalSystem.Web.Services;

namespace RentalSystem.Web.Controllers;

[ApiController]
[Authorize(Policy = AuthorizationPolicies.PropertyManagement)]
[Route("api/leases")]
public sealed class LeasesController : ControllerBase
{
    private readonly RentalDbContext _context;
    private readonly IContractService _contractService;

    public LeasesController(RentalDbContext context, IContractService contractService)
    {
        _context = context;
        _contractService = contractService;
    }

    [HttpGet("options")]
    public async Task<ActionResult<LeaseOptionsResponse>> GetOptions()
    {
        var tenants = await _context.Tenants
            .AsNoTracking()
            .OrderBy(t => t.Name)
            .Select(t => new LookupDto(t.Id, t.Name))
            .ToListAsync();

        var rooms = await _context.Rooms
            .AsNoTracking()
            .Where(r => r.Status == RoomStatus.Vacant)
            .OrderBy(r => r.Building!.Name)
            .ThenBy(r => r.RoomNumber)
            .Select(r => new LeaseRoomOptionDto(
                r.Id,
                r.BuildingId,
                r.Building != null ? r.Building.Name : string.Empty,
                r.RoomNumber,
                r.RoomType != null ? r.RoomType.Name : string.Empty,
                r.RoomType != null ? r.RoomType.BasePrice : 0m))
            .ToListAsync();

        return Ok(new LeaseOptionsResponse(tenants, rooms));
    }

    [HttpPost]
    public async Task<ActionResult<LeaseDto>> CreateLease([FromBody] CreateLeaseRequest request)
    {
        try
        {
            var contract = await _contractService.CreateLeaseAsync(
                request.TenantId,
                request.RoomId,
                request.StartDate.Date,
                request.EndDate.Date,
                request.RentPrice,
                request.DepositAmount);

            return CreatedAtAction(nameof(GetOptions), new { id = contract.Id }, await MapLeaseAsync(contract.Id));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("already has an active lease", StringComparison.OrdinalIgnoreCase))
                return Conflict(new { message = ex.Message });
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to create lease. " + ex.Message });
        }
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<LeaseDto>>> GetLeases([FromQuery] string? status = null, [FromQuery] int? buildingId = null)
    {
        IQueryable<Contract> query = _context.Contracts
            .AsNoTracking()
            .Include(c => c.Tenant)
            .Include(c => c.Room)
            .ThenInclude(r => r!.Building);

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<ContractStatus>(status, true, out var contractStatus))
            query = query.Where(c => c.Status == contractStatus);

        if (buildingId.HasValue)
            query = query.Where(c => c.Room!.BuildingId == buildingId);

        var leases = await query
            .OrderByDescending(c => c.StartDate)
            .Select(c => new LeaseDto(
                c.Id, c.TenantId, c.Tenant != null ? c.Tenant.Name : string.Empty,
                c.RoomId, c.Room != null ? c.Room.RoomNumber : string.Empty,
                c.Room != null && c.Room.Building != null ? c.Room.Building.Name : string.Empty,
                c.StartDate, c.EndDate, c.RentPrice, c.DepositAmount, c.Status.ToString()))
            .ToListAsync();

        return Ok(leases);
    }

    [HttpPut("{id:int}/terminate")]
    public async Task<ActionResult<LeaseDto>> TerminateLease(int id)
    {
        var contract = await _context.Contracts.Include(c => c.Room).FirstOrDefaultAsync(c => c.Id == id);
        if (contract == null) return NotFound();
        if (contract.Status != ContractStatus.Active)
            return Conflict(new { message = "Only active leases can be terminated." });

        contract.Status = ContractStatus.Terminated;
        if (contract.Room != null) contract.Room.Status = RoomStatus.Vacant;

        await _context.SaveChangesAsync();
        return Ok(await MapLeaseAsync(id));
    }

    [HttpPut("{id:int}/end")]
    public async Task<ActionResult<LeaseDto>> EndLease(int id)
    {
        var contract = await _context.Contracts.Include(c => c.Room).FirstOrDefaultAsync(c => c.Id == id);
        if (contract == null) return NotFound();
        if (contract.Status != ContractStatus.Active)
            return Conflict(new { message = "Only active leases can be ended." });

        contract.Status = ContractStatus.Ended;
        if (contract.Room != null) contract.Room.Status = RoomStatus.Vacant;

        await _context.SaveChangesAsync();
        return Ok(await MapLeaseAsync(id));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteLease(int id)
    {
        var contract = await _context.Contracts.FirstOrDefaultAsync(c => c.Id == id);
        if (contract == null) return NotFound();
        if (contract.Status == ContractStatus.Active)
            return Conflict(new { message = "Cannot delete an active lease." });

        _context.Contracts.Remove(contract);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    private async Task<LeaseDto> MapLeaseAsync(int id)
    {
        return await _context.Contracts
            .AsNoTracking()
            .Where(c => c.Id == id)
            .Select(c => new LeaseDto(
                c.Id, c.TenantId, c.Tenant != null ? c.Tenant.Name : string.Empty,
                c.RoomId, c.Room != null ? c.Room.RoomNumber : string.Empty,
                c.Room != null && c.Room.Building != null ? c.Room.Building.Name : string.Empty,
                c.StartDate, c.EndDate, c.RentPrice, c.DepositAmount, c.Status.ToString()))
            .SingleAsync();
    }
}
