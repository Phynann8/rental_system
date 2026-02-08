using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;
using RentalSystem.Web.Data;
using RentalSystem.Web.Models;

namespace RentalSystem.Web.Pages.Reports;

public class IndexModel : PageModel
{
    private readonly RentalDbContext _context;

    public IndexModel(RentalDbContext context)
    {
        _context = context;
    }

    public decimal TotalRevenueYTD { get; set; }
    public double OccupancyRate { get; set; }
    public decimal OutstandingBalance { get; set; }
    
    // Mocked trend data for now (or could be calculated)
    public List<string> OccupancyTrendLabels { get; set; } = new List<string>();
    public List<double> OccupancyTrendData { get; set; } = new List<double>();

    public async Task OnGetAsync()
    {
        // 1. Total Revenue YTD (Sum of payments in current year)
        var startOfYear = new DateTime(DateTime.Now.Year, 1, 1);
        TotalRevenueYTD = await _context.Payments
            .Where(p => p.Date >= startOfYear)
            .SumAsync(p => p.Amount);

        // 2. Current Occupancy Rate
        var totalRooms = await _context.Rooms.CountAsync();
        var occupiedRooms = await _context.Rooms.CountAsync(r => r.Status == RoomStatus.Occupied);
        OccupancyRate = totalRooms > 0 ? (double)occupiedRooms / totalRooms * 100 : 0;

        // 3. Outstanding Balances (Unpaid/Partial Invoices)
        // Remaining due = invoice total - sum of payments already received.
        OutstandingBalance = await _context.Invoices
            .Where(i => i.Status == InvoiceStatus.Unpaid || i.Status == InvoiceStatus.Partial)
            .Select(i => (decimal?)(i.TotalAmount - (i.Payments.Sum(p => (decimal?)p.Amount) ?? 0m)))
            .SumAsync() ?? 0m;

        // 4. Occupancy Trend (Mock Data for Demo - Last 6 months)
        // In a real app, you'd query historical snapshots or contract logs
        OccupancyTrendLabels = new List<string> { "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" };
        OccupancyTrendData = new List<double> { 65, 72, 68, 85, 82, 88 }; 
    }
}
