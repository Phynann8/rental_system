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
[Route("api/tenants")]
public sealed class TenantsController : ControllerBase
{
    private readonly RentalDbContext _context;

    public TenantsController(RentalDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<TenantDto>>> GetTenants()
    {
        var today = DateTime.Today;

        var rawTenants = await _context.Tenants
            .AsNoTracking()
            .Select(t => new
            {
                t.Id,
                t.Name,
                Phone = t.Phone ?? string.Empty,
                NationalId = t.NationalId ?? string.Empty,
                Hometown = t.Hometown ?? string.Empty,
                ActiveContract = t.Contracts
                    .Where(c => c.Status == ContractStatus.Active)
                    .OrderByDescending(c => c.StartDate)
                    .Select(c => new { c.Room.RoomNumber, c.EndDate })
                    .FirstOrDefault(),
                HasPending = t.Contracts.Any(c => c.StartDate > today)
            })
            .OrderBy(t => t.Name)
            .ToListAsync();

        var tenants = rawTenants.Select(t => new TenantDto(
            t.Id,
            t.Name,
            t.Phone,
            t.NationalId,
            t.Hometown,
            t.ActiveContract?.RoomNumber ?? "Unassigned",
            t.ActiveContract?.EndDate.ToString("MMM dd, yyyy") ?? "N/A",
            t.ActiveContract != null ? "Active" : t.HasPending ? "Pending" : "Former",
            $"https://picsum.photos/seed/tenant-{t.Id}/200/200"))
            .ToList();

        return Ok(tenants);
    }

    [HttpPost]
    public async Task<ActionResult<TenantDto>> CreateTenant([FromBody] UpsertTenantRequest request)
    {
        var tenant = new Tenant
        {
            Name = request.Name.Trim(),
            Phone = Clean(request.Phone),
            NationalId = Clean(request.NationalId),
            Hometown = Clean(request.Hometown)
        };

        _context.Tenants.Add(tenant);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetTenants), new { id = tenant.Id }, await MapTenantAsync(tenant.Id));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<TenantDto>> UpdateTenant(int id, [FromBody] UpsertTenantRequest request)
    {
        var tenant = await _context.Tenants.FindAsync(id);
        if (tenant == null)
        {
            return NotFound();
        }

        tenant.Name = request.Name.Trim();
        tenant.Phone = Clean(request.Phone);
        tenant.NationalId = Clean(request.NationalId);
        tenant.Hometown = Clean(request.Hometown);

        await _context.SaveChangesAsync();
        return Ok(await MapTenantAsync(id));
    }

    /// <summary>
    /// Deletes a tenant if they have no active contracts.
    /// </summary>
    [HttpDelete("{id:int}")]
    public async Task<ActionResult> DeleteTenant(int id)
    {
        var tenant = await _context.Tenants
            .Include(t => t.Contracts)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (tenant == null)
            return NotFound();

        // Guard: Cannot delete tenant with active contract
        if (tenant.Contracts.Any(c => c.Status == ContractStatus.Active))
            return Conflict(new { message = "Cannot delete tenant with an active lease. End the lease first." });

        _context.Tenants.Remove(tenant);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    private async Task<TenantDto> MapTenantAsync(int id)
    {
        var today = DateTime.Today;

        var t = await _context.Tenants
            .AsNoTracking()
            .Where(t => t.Id == id)
            .Select(t => new
            {
                t.Id,
                t.Name,
                Phone = t.Phone ?? string.Empty,
                NationalId = t.NationalId ?? string.Empty,
                Hometown = t.Hometown ?? string.Empty,
                ActiveContract = t.Contracts
                    .Where(c => c.Status == ContractStatus.Active)
                    .OrderByDescending(c => c.StartDate)
                    .Select(c => new { c.Room.RoomNumber, c.EndDate })
                    .FirstOrDefault(),
                HasPending = t.Contracts.Any(c => c.StartDate > today)
            })
            .SingleAsync();

        return new TenantDto(
            t.Id,
            t.Name,
            t.Phone,
            t.NationalId,
            t.Hometown,
            t.ActiveContract?.RoomNumber ?? "Unassigned",
            t.ActiveContract?.EndDate.ToString("MMM dd, yyyy") ?? "N/A",
            t.ActiveContract != null ? "Active" : t.HasPending ? "Pending" : "Former",
            $"https://picsum.photos/seed/tenant-{t.Id}/200/200");
    }

    private static string? Clean(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
}

public sealed record TenantDto(
    int Id,
    string Name,
    string Phone,
    string NationalId,
    string Hometown,
    string Room,
    string LeaseExpiry,
    string Status,
    string Image);

public sealed class UpsertTenantRequest
{
    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    [StringLength(20)]
    public string? Phone { get; set; }

    [StringLength(50)]
    public string? NationalId { get; set; }

    [StringLength(200)]
    public string? Hometown { get; set; }
}
