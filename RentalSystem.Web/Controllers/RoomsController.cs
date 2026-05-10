using RentalSystem.Web.Models.Dtos;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RentalSystem.Web.Data;
using RentalSystem.Web.Models;
using Microsoft.AspNetCore.Authorization;
using RentalSystem.Web.Security;

namespace RentalSystem.Web.Controllers;

[ApiController]
[Authorize(Policy = AuthorizationPolicies.PropertyManagement)]
[Route("api/rooms")]
public sealed class RoomsController : ControllerBase
{
    private readonly RentalDbContext _context;

    public RoomsController(RentalDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<RoomDto>>> GetRooms()
    {
        var today = DateTime.Today;

        var rooms = await _context.Rooms
            .AsNoTracking()
            .OrderBy(r => r.Building!.Name)
            .ThenBy(r => r.RoomNumber)
            .Select(r => new RoomDto(
                r.Id,
                r.BuildingId,
                r.RoomTypeId,
                r.RoomNumber,
                r.Building != null ? r.Building.Name : string.Empty,
                r.Floor,
                r.RoomType != null ? r.RoomType.Name : string.Empty,
                r.RoomType != null ? r.RoomType.BasePrice : 0m,
                r.Status.ToString(),
                r.Contracts
                    .Where(c => c.Status == ContractStatus.Active)
                    .OrderByDescending(c => c.StartDate)
                    .Select(c => c.Tenant != null ? c.Tenant.Name : null)
                    .FirstOrDefault(),
                r.Contracts
                    .Where(c => c.Status == ContractStatus.Active)
                    .OrderByDescending(c => c.StartDate)
                    .Select(c => c.EndDate.ToString("MMM dd, yyyy"))
                    .FirstOrDefault(),
                r.Contracts
                    .SelectMany(c => c.Invoices)
                    .Any(i => (i.Status == InvoiceStatus.Unpaid || i.Status == InvoiceStatus.Partial) && i.DueDate < today)))
            .ToListAsync();

        return Ok(rooms);
    }

    [HttpGet("lookups")]
    public async Task<ActionResult<RoomLookupResponse>> GetLookups()
    {
        var buildings = await _context.Buildings
            .AsNoTracking()
            .OrderBy(b => b.Name)
            .Select(b => new LookupDto(b.Id, b.Name))
            .ToListAsync();

        var roomTypes = await _context.RoomTypes
            .AsNoTracking()
            .OrderBy(rt => rt.Name)
            .Select(rt => new RoomTypeLookupDto(rt.Id, rt.Name, rt.BasePrice))
            .ToListAsync();

        return Ok(new RoomLookupResponse(buildings, roomTypes));
    }

    [HttpPost]
    public async Task<ActionResult<RoomDto>> CreateRoom([FromBody] UpsertRoomRequest request)
    {
        if (!await _context.Buildings.AnyAsync(b => b.Id == request.BuildingId))
            return BadRequest(new { message = "Building not found." });

        if (!await _context.RoomTypes.AnyAsync(rt => rt.Id == request.RoomTypeId))
            return BadRequest(new { message = "Room type not found." });

        var room = new Room
        {
            BuildingId = request.BuildingId,
            RoomTypeId = request.RoomTypeId,
            RoomNumber = request.RoomNumber.Trim(),
            Floor = request.Floor,
            Status = request.Status
        };

        _context.Rooms.Add(room);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetRooms), new { id = room.Id }, await MapRoomAsync(room.Id));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<RoomDto>> UpdateRoom(int id, [FromBody] UpsertRoomRequest request)
    {
        var room = await _context.Rooms.Include(r => r.Contracts).FirstOrDefaultAsync(r => r.Id == id);
        if (room == null) return NotFound();

        var hasActiveLease = room.Contracts.Any(c => c.Status == ContractStatus.Active);
        if (hasActiveLease && request.Status != RoomStatus.Occupied)
            return BadRequest(new { message = "Rooms with an active lease must remain occupied." });

        room.BuildingId = request.BuildingId;
        room.RoomTypeId = request.RoomTypeId;
        room.RoomNumber = request.RoomNumber.Trim();
        room.Floor = request.Floor;
        room.Status = hasActiveLease ? RoomStatus.Occupied : request.Status;

        await _context.SaveChangesAsync();
        return Ok(await MapRoomAsync(id));
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult> DeleteRoom(int id)
    {
        var room = await _context.Rooms.Include(r => r.Contracts).FirstOrDefaultAsync(r => r.Id == id);
        if (room == null) return NotFound();
        if (room.Contracts.Any(c => c.Status == ContractStatus.Active))
            return Conflict(new { message = "Cannot delete room with an active lease." });

        _context.Rooms.Remove(room);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    private async Task<RoomDto> MapRoomAsync(int id)
    {
        var today = DateTime.Today;
        return await _context.Rooms
            .AsNoTracking()
            .Where(r => r.Id == id)
            .Select(r => new RoomDto(
                r.Id, r.BuildingId, r.RoomTypeId, r.RoomNumber,
                r.Building != null ? r.Building.Name : string.Empty,
                r.Floor,
                r.RoomType != null ? r.RoomType.Name : string.Empty,
                r.RoomType != null ? r.RoomType.BasePrice : 0m,
                r.Status.ToString(),
                r.Contracts.Where(c => c.Status == ContractStatus.Active).OrderByDescending(c => c.StartDate).Select(c => c.Tenant != null ? c.Tenant.Name : null).FirstOrDefault(),
                r.Contracts.Where(c => c.Status == ContractStatus.Active).OrderByDescending(c => c.StartDate).Select(c => c.EndDate.ToString("MMM dd, yyyy")).FirstOrDefault(),
                r.Contracts.SelectMany(c => c.Invoices).Any(i => (i.Status == InvoiceStatus.Unpaid || i.Status == InvoiceStatus.Partial) && i.DueDate < today)))
            .SingleAsync();
    }
}
