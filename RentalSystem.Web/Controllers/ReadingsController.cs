using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RentalSystem.Web.Data;
using RentalSystem.Web.Models;
using RentalSystem.Web.Security;

namespace RentalSystem.Web.Controllers;

[ApiController]
[Authorize(Policy = AuthorizationPolicies.BillingOperations)]
[Route("api/readings")]
public sealed class ReadingsController : ControllerBase
{
    private readonly RentalDbContext _context;

    public ReadingsController(RentalDbContext context)
    {
        _context = context;
    }

    [HttpGet("{buildingId:int}")]
    public async Task<ActionResult<IReadOnlyList<RoomReadingDto>>> GetReadings(int buildingId)
    {
        if (!await _context.Buildings.AnyAsync(b => b.Id == buildingId))
        {
            return NotFound();
        }

        var rooms = await _context.Rooms
            .AsNoTracking()
            .Include(r => r.RoomType)
            .Include(r => r.Meters)
            .Where(r => r.BuildingId == buildingId && r.Status == RoomStatus.Occupied)
            .OrderBy(r => r.RoomNumber)
            .ToListAsync();

        var payload = rooms.Select(r =>
        {
            // Get 2 most recent water readings to calculate usage (new - old)
            var waterReadings = r.Meters
                .Where(m => m.Type == MeterType.Water)
                .OrderByDescending(m => m.LastReadingDate)
                .Take(2)
                .ToList();
            
            double oldWater = waterReadings.Count >= 2 ? waterReadings[1].CurrentReading : 0;
            double newWater = waterReadings.Count >= 1 ? waterReadings[0].CurrentReading : 0;

            // Get 2 most recent electric readings to calculate usage (new - old)
            var electricReadings = r.Meters
                .Where(m => m.Type == MeterType.Electric)
                .OrderByDescending(m => m.LastReadingDate)
                .Take(2)
                .ToList();
            
            double oldElectric = electricReadings.Count >= 2 ? electricReadings[1].CurrentReading : 0;
            double newElectric = electricReadings.Count >= 1 ? electricReadings[0].CurrentReading : 0;

            return new RoomReadingDto(
                r.Id,
                r.RoomNumber,
                r.RoomType?.Name ?? "N/A",
                oldWater,
                newWater,
                oldElectric,
                newElectric);
        }).ToList();

        return Ok(payload);
    }

    [HttpPost]
    public async Task<ActionResult<IReadOnlyList<RoomReadingDto>>> SaveReadings([FromBody] SaveReadingsRequest request)
    {
        if (!await _context.Buildings.AnyAsync(b => b.Id == request.BuildingId))
        {
            return BadRequest(new { message = "Building not found." });
        }

        var roomIds = request.Rooms.Select(r => r.RoomId).Distinct().ToList();
        var rooms = await _context.Rooms
            .Include(r => r.Meters)
            .Where(r => r.BuildingId == request.BuildingId && roomIds.Contains(r.Id))
            .ToListAsync();

        var now = DateTime.Now;

        foreach (var reading in request.Rooms)
        {
            var room = rooms.FirstOrDefault(r => r.Id == reading.RoomId);
            if (room == null)
            {
                return BadRequest(new { message = $"Room {reading.RoomId} is invalid for this building." });
            }

            var latestWater = room.Meters
                .Where(m => m.Type == MeterType.Water)
                .OrderByDescending(m => m.LastReadingDate)
                .FirstOrDefault()?.CurrentReading ?? 0;
            var latestElectric = room.Meters
                .Where(m => m.Type == MeterType.Electric)
                .OrderByDescending(m => m.LastReadingDate)
                .FirstOrDefault()?.CurrentReading ?? 0;

            if (reading.NewWater < latestWater || reading.NewElectric < latestElectric)
            {
                return BadRequest(new { message = $"Meter readings for room {room.RoomNumber} cannot decrease." });
            }

            _context.UtilityMeters.Add(new UtilityMeter
            {
                RoomId = room.Id,
                Type = MeterType.Water,
                CurrentReading = reading.NewWater,
                LastReadingDate = now
            });
            _context.UtilityMeters.Add(new UtilityMeter
            {
                RoomId = room.Id,
                Type = MeterType.Electric,
                CurrentReading = reading.NewElectric,
                LastReadingDate = now
            });
        }

        await _context.SaveChangesAsync();
        return await GetReadings(request.BuildingId);
    }
}

public sealed record RoomReadingDto(
    int RoomId,
    string RoomNumber,
    string RoomType,
    double OldWater,
    double NewWater,
    double OldElectric,
    double NewElectric);

public sealed class SaveReadingsRequest
{
    [Range(1, int.MaxValue)]
    public int BuildingId { get; set; }

    [MinLength(1)]
    public List<RoomReadingInput> Rooms { get; set; } = new();
}

public sealed class RoomReadingInput
{
    [Range(1, int.MaxValue)]
    public int RoomId { get; set; }

    [Range(0, double.MaxValue)]
    public double NewWater { get; set; }

    [Range(0, double.MaxValue)]
    public double NewElectric { get; set; }
}
