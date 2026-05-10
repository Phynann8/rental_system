using System;
using System.Collections.Generic;

namespace RentalSystem.Web.Models.Dtos;

public sealed record DashboardResponse(
    int TotalBuildings,
    int TotalRooms,
    int OccupiedRooms,
    double OccupancyRate,
    int ActiveTenants,
    int UnpaidCount,
    decimal UnpaidAmount,
    decimal ProjectedRevenue,
    decimal CollectedThisMonth,
    IReadOnlyList<RevenuePointDto> Revenue,
    IReadOnlyList<ActivityDto> Activity);

public sealed record ActivityDto(string Id, string Type, string Title, string Description, DateTime At);

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
