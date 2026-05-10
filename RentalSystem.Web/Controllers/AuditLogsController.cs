using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RentalSystem.Web.Data;
using RentalSystem.Web.Security;

namespace RentalSystem.Web.Controllers;

[ApiController]
[Authorize(Policy = AuthorizationPolicies.PropertyManagement)] // Only staff should view audit logs
[Route("api/audit-logs")]
public sealed class AuditLogsController : ControllerBase
{
    private readonly RentalDbContext _context;

    public AuditLogsController(RentalDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<AuditLogDto>>> GetAuditLogs(
        [FromQuery] string? entityName,
        [FromQuery] string? entityId,
        [FromQuery] string? action,
        [FromQuery] int limit = 100)
    {
        var query = _context.AuditLogs.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(entityName))
        {
            query = query.Where(a => a.EntityName == entityName);
        }

        if (!string.IsNullOrWhiteSpace(entityId))
        {
            query = query.Where(a => a.EntityId == entityId);
        }

        if (!string.IsNullOrWhiteSpace(action))
        {
            query = query.Where(a => a.Action == action);
        }

        var logs = await query
            .OrderByDescending(a => a.TimestampUtc)
            .Take(Math.Min(limit, 500))
            .ToListAsync();

        var dtos = logs.Select(a => new AuditLogDto(
            a.Id,
            a.UserId,
            a.Username,
            a.Action,
            a.EntityName,
            a.EntityId,
            a.OldValues,
            a.NewValues,
            a.IpAddress,
            a.TimestampUtc
        )).ToList();

        return Ok(dtos);
    }
}

public sealed record AuditLogDto(
    int Id,
    string? UserId,
    string? Username,
    string Action,
    string EntityName,
    string EntityId,
    string? OldValues,
    string? NewValues,
    string? IpAddress,
    DateTime TimestampUtc
);
