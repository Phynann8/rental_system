using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;
using RentalSystem.Web.Data;
using RentalSystem.Web.Models;

namespace RentalSystem.Web.Pages;

public class IndexModel : PageModel
{
    private readonly ILogger<IndexModel> _logger;
    private readonly RentalDbContext _context;

    public IndexModel(ILogger<IndexModel> logger, RentalDbContext context)
    {
        _logger = logger;
        _context = context;
    }

    public int TotalRooms { get; set; }
    public int OccupiedRooms { get; set; }
    public double OccupancyRate { get; set; }
    public decimal MonthlyRevenue { get; set; }
    public int PendingInvoicesCount { get; set; }
    public decimal PendingInvoicesAmount { get; set; }

    public IList<Invoice> RecentInvoices { get; set; } = new List<Invoice>();
    
    // Chart Data
    public List<string> MonthlyRevenueLabels { get; set; } = new List<string>();
    public List<decimal> MonthlyRevenueData { get; set; } = new List<decimal>();

    // Recent Payments
    public IList<Payment> RecentPayments { get; set; } = new List<Payment>();

    public async Task OnGetAsync()
    {
        // 1. Occupancy Stats
        TotalRooms = await _context.Rooms.CountAsync();
        OccupiedRooms = await _context.Rooms.CountAsync(r => r.Status == RoomStatus.Occupied);
        OccupancyRate = TotalRooms > 0 ? (double)OccupiedRooms / TotalRooms * 100 : 0;

        // 2. Revenue Projected (Active Contracts)
        MonthlyRevenue = await _context.Contracts
            .Where(c => c.Status == ContractStatus.Active)
            .SumAsync(c => c.RentPrice);

        // 3. Pending Invoices (Unpaid or Partial)
        var pendingInvoicesQuery = _context.Invoices
            .Where(i => i.Status == InvoiceStatus.Unpaid || i.Status == InvoiceStatus.Partial);

        PendingInvoicesCount = await pendingInvoicesQuery.CountAsync();
        PendingInvoicesAmount = await pendingInvoicesQuery.SumAsync(i => i.TotalAmount);

        // 4. Recent Invoices List (Top 5)
        RecentInvoices = await _context.Invoices
            .Include(i => i.Contract).ThenInclude(c => c.Tenant)
            .Include(i => i.Contract).ThenInclude(c => c.Room)
            .OrderByDescending(i => i.Date)
            .Take(5)
            .ToListAsync();

        // 5. Monthly Revenue Chart (Last 6 Months)
        MonthlyRevenueLabels = new List<string>();
        MonthlyRevenueData = new List<decimal>();

        for (int i = 5; i >= 0; i--)
        {
            var date = DateTime.Now.AddMonths(-i);
            var monthStart = new DateTime(date.Year, date.Month, 1);
            var monthEnd = monthStart.AddMonths(1).AddDays(-1);

            var monthlyTotal = await _context.Payments
                .Where(p => p.Date >= monthStart && p.Date <= monthEnd)
                .SumAsync(p => p.Amount);

            MonthlyRevenueLabels.Add(date.ToString("MMM"));
            MonthlyRevenueData.Add(monthlyTotal);
        }

        // 6. Recent Payments (for Activity Feed)
        RecentPayments = await _context.Payments
            .Include(p => p.Invoice).ThenInclude(i => i.Contract).ThenInclude(c => c.Room)
            .Include(p => p.Invoice).ThenInclude(i => i.Contract).ThenInclude(c => c.Tenant)
            .OrderByDescending(p => p.Date)
            .Take(5)
            .ToListAsync();
    }
}
