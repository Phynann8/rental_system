using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using RentalSystem.Web.Data;
using RentalSystem.Web.Models;
using RentalSystem.Web.Models.Dtos;

namespace RentalSystem.Web.Services;

public interface IDashboardService
{
    Task<DashboardResponse> GetDashboardAsync();
    Task<IReadOnlyList<BuildingComparisonDto>> GetBuildingComparisonsAsync();
}

public class DashboardService : IDashboardService
{
    private readonly RentalDbContext _context;

    public DashboardService(RentalDbContext context)
    {
        _context = context;
    }

    public async Task<DashboardResponse> GetDashboardAsync()
    {
        var today = DateTime.Today;
        var monthStart = new DateTime(today.Year, today.Month, 1);
        var nextMonthStart = monthStart.AddMonths(1);

        var totalBuildings = await _context.Buildings.CountAsync();
        var totalRooms = await _context.Rooms.CountAsync();
        var occupiedRooms = await _context.Rooms.CountAsync(r => r.Status == RoomStatus.Occupied);
        var activeTenants = await _context.Contracts.CountAsync(c => c.Status == ContractStatus.Active);

        var unpaidQuery = _context.Invoices.Where(i => i.Status == InvoiceStatus.Unpaid || i.Status == InvoiceStatus.Partial);
        var unpaidCount = await unpaidQuery.CountAsync();
        var unpaidInvoicesList = await unpaidQuery.Include(i => i.Payments).ToListAsync();
        var unpaidAmount = unpaidInvoicesList.Sum(i => i.TotalAmount - i.Payments.Where(p => p.IsVerified).Sum(p => p.Amount));

        var projectedRevenue = await _context.Contracts
            .Where(c => c.Status == ContractStatus.Active)
            .SumAsync(c => (decimal?)c.RentPrice) ?? 0m;

        var collectedThisMonth = await _context.Payments
            .Where(p => p.Date >= monthStart && p.Date < nextMonthStart && p.IsVerified)
            .SumAsync(p => (decimal?)p.Amount) ?? 0m;

        var revenue = new List<RevenuePointDto>();
        for (var offset = 5; offset >= 0; offset--)
        {
            var cursor = monthStart.AddMonths(-offset);
            var periodEnd = cursor.AddMonths(1);
            var total = await _context.Payments
                .Where(p => p.Date >= cursor && p.Date < periodEnd && p.IsVerified)
                .SumAsync(p => (decimal?)p.Amount) ?? 0m;

            revenue.Add(new RevenuePointDto(cursor.ToString("MMM"), total));
        }

        var recentPayments = await _context.Payments
            .AsNoTracking()
            .Include(p => p.Invoice!).ThenInclude(i => i.Contract!).ThenInclude(c => c.Room)
            .Include(p => p.Invoice!).ThenInclude(i => i.Contract!).ThenInclude(c => c.Tenant)
            .OrderByDescending(p => p.Date)
            .Take(4)
            .ToListAsync();

        var recentContracts = await _context.Contracts
            .AsNoTracking()
            .Include(c => c.Room)
            .Include(c => c.Tenant)
            .OrderByDescending(c => c.StartDate)
            .Take(4)
            .ToListAsync();

        var activity = new List<ActivityDto>();
        activity.AddRange(recentPayments
            .Where(p => p.Invoice?.Contract?.Room != null && p.Invoice.Contract.Tenant != null)
            .Select(p => new ActivityDto(
                $"PAY-{p.Id}",
                "Payment",
                $"Payment received from {p.Invoice!.Contract!.Tenant!.Name}",
                $"{p.Amount:C} recorded for room {p.Invoice.Contract.Room!.RoomNumber}.",
                p.Date)));
        activity.AddRange(recentContracts
            .Where(c => c.Room != null && c.Tenant != null)
            .Select(c => new ActivityDto(
                $"LEASE-{c.Id}",
                "Lease",
                $"Lease created for room {c.Room!.RoomNumber}",
                $"{c.Tenant!.Name} starts on {c.StartDate:MMM dd, yyyy}.",
                c.StartDate)));

        return new DashboardResponse(
            totalBuildings,
            totalRooms,
            occupiedRooms,
            totalRooms == 0 ? 0 : Math.Round((double)occupiedRooms / totalRooms * 100, 1),
            activeTenants,
            unpaidCount,
            unpaidAmount,
            projectedRevenue,
            collectedThisMonth,
            revenue,
            activity
                .OrderByDescending(a => a.At)
                .Take(6)
                .ToList());
    }

    public async Task<IReadOnlyList<BuildingComparisonDto>> GetBuildingComparisonsAsync()
    {
        var today = DateTime.Today;
        var monthStart = new DateTime(today.Year, today.Month, 1);
        var nextMonthStart = monthStart.AddMonths(1);

        var buildings = await _context.Buildings
            .AsNoTracking()
            .Include(b => b.Rooms)
            .OrderBy(b => b.Name)
            .ToListAsync();

        var result = new List<BuildingComparisonDto>();

        foreach (var building in buildings)
        {
            var roomIds = building.Rooms.Select(r => r.Id).ToList();
            var totalRooms = building.Rooms.Count;
            var occupiedRooms = building.Rooms.Count(r => r.Status == RoomStatus.Occupied);
            var occupancyRate = totalRooms == 0 ? 0 : Math.Round((double)occupiedRooms / totalRooms * 100, 1);

            var activeTenants = await _context.Contracts
                .CountAsync(c => c.Status == ContractStatus.Active && roomIds.Contains(c.RoomId));

            var collectedThisMonth = await _context.Payments
                .Where(p => p.Date >= monthStart && p.Date < nextMonthStart && p.IsVerified
                    && p.Invoice != null && p.Invoice.Contract != null
                    && roomIds.Contains(p.Invoice.Contract.RoomId))
                .SumAsync(p => (decimal?)p.Amount) ?? 0m;

            var unpaidInvoices = await _context.Invoices
                .AsNoTracking()
                .Include(i => i.Payments)
                .Where(i => (i.Status == InvoiceStatus.Unpaid || i.Status == InvoiceStatus.Partial)
                    && i.Contract != null && roomIds.Contains(i.Contract.RoomId))
                .ToListAsync();

            var outstandingBalance = unpaidInvoices.Sum(i => i.TotalAmount - i.Payments.Where(p => p.IsVerified).Sum(p => p.Amount));

            var projectedRevenue = await _context.Contracts
                .Where(c => c.Status == ContractStatus.Active && roomIds.Contains(c.RoomId))
                .SumAsync(c => (decimal?)c.RentPrice) ?? 0m;

            result.Add(new BuildingComparisonDto(
                building.Id,
                building.Name,
                building.Address ?? string.Empty,
                totalRooms,
                occupiedRooms,
                occupancyRate,
                activeTenants,
                collectedThisMonth,
                projectedRevenue,
                outstandingBalance,
                $"https://picsum.photos/seed/building-{building.Id}/240/240"));
        }

        return result;
    }
}
