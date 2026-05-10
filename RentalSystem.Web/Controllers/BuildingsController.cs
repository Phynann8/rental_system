using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RentalSystem.Web.Data;
using RentalSystem.Web.Models;
using RentalSystem.Web.Security;

namespace RentalSystem.Web.Controllers;

[ApiController]
[Authorize(Policy = AuthorizationPolicies.PropertyManagement)]
[Route("api/buildings")]
public sealed class BuildingsController : ControllerBase
{
    private readonly RentalDbContext _context;

    public BuildingsController(RentalDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<BuildingDto>>> GetBuildings()
    {
        var rawBuildings = await _context.Buildings
            .AsNoTracking()
            .Select(b => new
            {
                b.Id,
                b.Name,
                Address = b.Address ?? string.Empty,
                TotalRooms = b.Rooms.Count,
                OccupiedRooms = b.Rooms.Count(r => r.Status == RoomStatus.Occupied),
                VacantRooms = b.Rooms.Count(r => r.Status == RoomStatus.Vacant),
                HasMaintenance = b.Rooms.Any(r => r.Status == RoomStatus.Maintenance),
                b.WaterUnitPrice,
                b.ElectricUnitPrice
            })
            .OrderBy(b => b.Name)
            .ToListAsync();

        var buildings = rawBuildings.Select(b => new BuildingDto(
            b.Id,
            b.Name,
            b.Address,
            b.TotalRooms,
            b.OccupiedRooms,
            b.VacantRooms,
            b.OccupiedRooms > 0 ? "Active" : b.HasMaintenance ? "Maintenance" : "Inactive",
            b.WaterUnitPrice,
            b.ElectricUnitPrice,
            $"https://picsum.photos/seed/building-{b.Id}/240/240"))
            .ToList();

        return Ok(buildings);
    }

    [HttpPost]
    public async Task<ActionResult<BuildingDto>> CreateBuilding([FromBody] UpsertBuildingRequest request)
    {
        var building = new Building
        {
            Name = request.Name.Trim(),
            Address = string.IsNullOrWhiteSpace(request.Address) ? null : request.Address.Trim(),
            WaterUnitPrice = request.WaterUnitPrice,
            ElectricUnitPrice = request.ElectricUnitPrice
        };

        _context.Buildings.Add(building);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetBuildings), new { id = building.Id }, await MapBuildingAsync(building.Id));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<BuildingDto>> UpdateBuilding(int id, [FromBody] UpsertBuildingRequest request)
    {
        var building = await _context.Buildings.FindAsync(id);
        if (building == null)
        {
            return NotFound();
        }

        building.Name = request.Name.Trim();
        building.Address = string.IsNullOrWhiteSpace(request.Address) ? null : request.Address.Trim();
        building.WaterUnitPrice = request.WaterUnitPrice;
        building.ElectricUnitPrice = request.ElectricUnitPrice;

        await _context.SaveChangesAsync();
        return Ok(await MapBuildingAsync(id));
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult> DeleteBuilding(int id)
    {
        var building = await _context.Buildings
            .Include(b => b.Rooms)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (building == null)
        {
            return NotFound();
        }

        // Guard: Cannot delete if building has any rooms
        if (building.Rooms.Count > 0)
        {
            return Conflict(new { message = "Cannot delete building with rooms. Delete all rooms first." });
        }

        _context.Buildings.Remove(building);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private async Task<BuildingDto> MapBuildingAsync(int id)
    {
        var b = await _context.Buildings
            .AsNoTracking()
            .Where(b => b.Id == id)
            .Select(b => new
            {
                b.Id,
                b.Name,
                Address = b.Address ?? string.Empty,
                TotalRooms = b.Rooms.Count,
                OccupiedRooms = b.Rooms.Count(r => r.Status == RoomStatus.Occupied),
                VacantRooms = b.Rooms.Count(r => r.Status == RoomStatus.Vacant),
                HasMaintenance = b.Rooms.Any(r => r.Status == RoomStatus.Maintenance),
                b.WaterUnitPrice,
                b.ElectricUnitPrice
            })
            .SingleAsync();

        return new BuildingDto(
            b.Id,
            b.Name,
            b.Address,
            b.TotalRooms,
            b.OccupiedRooms,
            b.VacantRooms,
            b.OccupiedRooms > 0 ? "Active" : b.HasMaintenance ? "Maintenance" : "Inactive",
            b.WaterUnitPrice,
            b.ElectricUnitPrice,
            $"https://picsum.photos/seed/building-{b.Id}/240/240");
    }
}

public sealed record BuildingDto(
    int Id,
    string Name,
    string Address,
    int Rooms,
    int OccupiedRooms,
    int VacantRooms,
    string Status,
    decimal WaterUnitPrice,
    decimal ElectricUnitPrice,
    string Image);

public sealed class UpsertBuildingRequest
{
    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    [StringLength(200)]
    public string? Address { get; set; }

    [Range(typeof(decimal), "0", "999999")]
    public decimal WaterUnitPrice { get; set; } = 0.5m;

    [Range(typeof(decimal), "0", "999999")]
    public decimal ElectricUnitPrice { get; set; } = 0.25m;
}
