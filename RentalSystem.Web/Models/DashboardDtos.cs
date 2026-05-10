using System;
using System.Collections.Generic;

namespace RentalSystem.Web.Controllers
{
    public sealed record RevenuePointDto(string Name, decimal Value);
    public sealed record ActivityDto(string Type, string Title, string Description, DateTime At);

    public sealed record BuildingComparisonDto(
        int Id,
        string Name,
        string Address,
        int TotalRooms,
        int OccupiedRooms,
        double OccupancyRate,
        int ActiveTenants,
        decimal CollectedThisMonth,
        decimal ProjectedRevenue,
        decimal OutstandingBalance,
        string Image);
}
