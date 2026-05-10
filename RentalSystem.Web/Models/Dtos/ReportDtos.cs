using System;
using System.Collections.Generic;

namespace RentalSystem.Web.Models.Dtos;

public sealed record RevenueReportResponse(decimal TotalYtd, decimal RentalIncome, decimal UtilityIncome, IReadOnlyList<RevenuePointDto> Monthly);
public sealed record RevenuePointDto(string Name, decimal Value);
public sealed record HistoricalOccupancyDto(string Name, double Rate);
public sealed record OccupancyReportResponse(double CurrentRate, IReadOnlyList<HistoricalOccupancyDto> Historical);
public sealed record OutstandingByBuildingDto(string Building, decimal Amount);
public sealed record OutstandingReportResponse(decimal TotalOutstanding, IReadOnlyList<OutstandingByBuildingDto> ByBuilding);
