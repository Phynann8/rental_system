using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using RentalSystem.Web.Data;
using RentalSystem.Web.Models;
using RentalSystem.Web.Models.Dtos;

namespace RentalSystem.Web.Services;

public interface IReportService
{
    Task<RevenueReportResponse> GetRevenueReportAsync(int? year);
    Task<OccupancyReportResponse> GetOccupancyReportAsync();
    Task<OutstandingReportResponse> GetOutstandingReportAsync();
}

public class ReportService : IReportService
{
    private readonly RentalDbContext _context;

    public ReportService(RentalDbContext context)
    {
        _context = context;
    }

    public async Task<RevenueReportResponse> GetRevenueReportAsync(int? year)
    {
        var targetYear = year ?? DateTime.Today.Year;
        var startOfYear = new DateTime(targetYear, 1, 1);
        var endOfYear = startOfYear.AddYears(1);

        var payments = await _context.Payments
            .AsNoTracking()
            .Include(p => p.Invoice!).ThenInclude(i => i.Items)
            .Where(p => p.Date >= startOfYear && p.Date < endOfYear && p.IsVerified)
            .ToListAsync();

        var totalYtd = payments.Sum(p => p.Amount);
        
        var (rentalIncome, utilityIncome) = CalculateIncomeBreakdown(payments);

        var monthlyPoints = Enumerable.Range(1, 12).Select(month => {
            var currentMonth = new DateTime(targetYear, month, 1);
            var nextMonth = currentMonth.AddMonths(1);
            var sum = payments.Where(p => p.Date >= currentMonth && p.Date < nextMonth).Sum(p => p.Amount);
            return new RevenuePointDto(currentMonth.ToString("MMM"), sum);
        }).ToList();

        return new RevenueReportResponse(totalYtd, rentalIncome, utilityIncome, monthlyPoints);
    }

    public async Task<OccupancyReportResponse> GetOccupancyReportAsync()
    {
        var totalRooms = await _context.Rooms.CountAsync();
        var occupiedRooms = await _context.Rooms.CountAsync(r => r.Status == RoomStatus.Occupied);

        var currentRate = CalculateOccupancyRate(occupiedRooms, totalRooms);

        var historical = new List<HistoricalOccupancyDto>();
        var now = DateTime.Today;

        for (int i = 5; i >= 0; i--)
        {
            var cursorStart = new DateTime(now.Year, now.Month, 1).AddMonths(-i);
            var cursorEnd = cursorStart.AddMonths(1).AddTicks(-1);

            var activeContracts = await _context.Contracts
                .Where(c => c.StartDate <= cursorEnd && 
                           (c.Status == ContractStatus.Active || c.Status == ContractStatus.Terminated || c.Status == ContractStatus.Ended) && 
                           (c.EndDate >= cursorStart))
                .CountAsync();
            
            var safeContracts = Math.Min(activeContracts, totalRooms);
            var rate = CalculateOccupancyRate(safeContracts, totalRooms);

            historical.Add(new HistoricalOccupancyDto(cursorStart.ToString("MMM"), rate));
        }

        return new OccupancyReportResponse(currentRate, historical);
    }

    public async Task<OutstandingReportResponse> GetOutstandingReportAsync()
    {
        var unpaidInvoices = await _context.Invoices
            .AsNoTracking()
            .Include(i => i.Contract!).ThenInclude(c => c.Room!).ThenInclude(r => r.Building)
            .Include(i => i.Payments)
            .Where(i => i.Status == InvoiceStatus.Unpaid || i.Status == InvoiceStatus.Partial)
            .ToListAsync();

        var totalOutstanding = 0m;
        var buildingBalances = new Dictionary<string, decimal>();

        foreach (var inv in unpaidInvoices)
        {
            var paid = inv.Payments.Where(p => p.IsVerified).Sum(p => p.Amount);
            var balance = inv.TotalAmount - paid;
            
            if (balance <= 0) continue;

            totalOutstanding += balance;
            var buildingName = inv.Contract?.Room?.Building?.Name ?? "Unknown";
            
            if (!buildingBalances.ContainsKey(buildingName))
                buildingBalances[buildingName] = 0;
            
            buildingBalances[buildingName] += balance;
        }

        var byBuilding = buildingBalances.Select(kvp => new OutstandingByBuildingDto(kvp.Key, kvp.Value))
            .OrderByDescending(x => x.Amount)
            .ToList();

        return new OutstandingReportResponse(totalOutstanding, byBuilding);
    }

    private static (decimal Rental, decimal Utility) CalculateIncomeBreakdown(IEnumerable<Payment> payments)
    {
        decimal rentalIncome = 0;
        decimal utilityIncome = 0;

        foreach (var payment in payments)
        {
            if (payment.Invoice?.Items == null || payment.Invoice.TotalAmount <= 0) continue;

            var invoiceRent = payment.Invoice.Items.Where(i => i.Description.Contains("Rent")).Sum(i => i.Total);
            var invoiceUtil = payment.Invoice.Items.Where(i => !i.Description.Contains("Rent")).Sum(i => i.Total);
            
            var rentRatio = invoiceRent / payment.Invoice.TotalAmount;
            var utilRatio = invoiceUtil / payment.Invoice.TotalAmount;

            rentalIncome += payment.Amount * rentRatio;
            utilityIncome += payment.Amount * utilRatio;
        }

        return (rentalIncome, utilityIncome);
    }

    private static double CalculateOccupancyRate(int occupied, int total)
    {
        return total == 0 ? 0 : Math.Round((double)occupied / total * 100, 1);
    }
}
