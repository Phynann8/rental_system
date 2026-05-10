using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RentalSystem.Web.Data;
using RentalSystem.Web.Models;
using RentalSystem.Web.Security;

namespace RentalSystem.Web.Controllers;

[ApiController]
[Authorize(Policy = AuthorizationPolicies.DashboardRead)]
[Route("api/ai")]
public sealed class AiController : ControllerBase
{
    private readonly RentalDbContext _context;

    public AiController(RentalDbContext context)
    {
        _context = context;
    }

    [HttpGet("intelligence-data")]
    public async Task<ActionResult<AiIntelligencePayload>> GetIntelligenceData(CancellationToken cancellationToken)
    {
        var now = DateTime.Today;
        var sixMonthsAgo = now.AddMonths(-6);

        // 1. Room Inventory Metrics
        var rooms = await _context.Rooms
            .AsNoTracking()
            .Include(r => r.RoomType)
            .Include(r => r.Building)
            .Select(r => new AiRoomMetric(
                r.RoomNumber,
                r.Building!.Name,
                r.RoomType!.Name,
                r.RoomType.BasePrice,
                r.Status.ToString()
            ))
            .ToListAsync(cancellationToken);

        // 2. Lease Cluster Metrics (Expirations)
        var leases = await _context.Contracts
            .AsNoTracking()
            .Where(c => c.Status == ContractStatus.Active)
            .Select(c => new AiLeaseMetric(
                c.Tenant!.Name,
                c.Room!.RoomNumber,
                c.EndDate,
                c.RentPrice
            ))
            .ToListAsync(cancellationToken);

        // 3. Historical Revenue Trends (Last 6 months)
        var revenueData = await _context.Payments
            .AsNoTracking()
            .Where(p => p.Date >= sixMonthsAgo && p.IsVerified)
            .Select(p => new { p.Date.Year, p.Date.Month, p.Amount })
            .ToListAsync(cancellationToken);

        var revenue = revenueData
            .GroupBy(p => new { p.Year, p.Month })
            .Select(g => new AiRevenueMetric(
                g.Key.Year,
                g.Key.Month,
                g.Sum(p => p.Amount)
            ))
            .OrderBy(r => r.Year).ThenBy(r => r.Month)
            .ToList();

        // 4. Utility Consumption Anomaly Detection (Last 3 readings per room)
        var utilities = await _context.UtilityMeters
            .AsNoTracking()
            .Include(m => m.Room)
            .OrderByDescending(m => m.LastReadingDate)
            .Take(200) // Representative sample
            .Select(m => new AiUtilityMetric(
                m.Room!.RoomNumber,
                m.Type.ToString(),
                m.CurrentReading,
                m.LastReadingDate
            ))
            .ToListAsync(cancellationToken);

        return Ok(new AiIntelligencePayload(rooms, leases, revenue, utilities));
    }
}

public sealed record AiRoomMetric(string RoomNumber, string Building, string Type, decimal CurrentPrice, string Status);
public sealed record AiLeaseMetric(string Tenant, string Room, DateTime EndDate, decimal Price);
public sealed record AiRevenueMetric(int Year, int Month, decimal TotalCollected);
public sealed record AiUtilityMetric(string Room, string Type, double Value, DateTime Date);
public sealed record AiIntelligencePayload(
    List<AiRoomMetric> Rooms,
    List<AiLeaseMetric> Leases,
    List<AiRevenueMetric> Revenue,
    List<AiUtilityMetric> Utilities);
