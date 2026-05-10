using System.ComponentModel.DataAnnotations;

namespace RentalSystem.Web.Models.Dtos;

public sealed record LeaseOptionsResponse(IReadOnlyList<LookupDto> Tenants, IReadOnlyList<LeaseRoomOptionDto> Rooms);
public sealed record LeaseRoomOptionDto(int Id, int BuildingId, string Building, string RoomNumber, string RoomType, decimal BasePrice);
public sealed record LeaseDto(
    int Id,
    int TenantId,
    string TenantName,
    int RoomId,
    string RoomNumber,
    string Building,
    DateTime StartDate,
    DateTime EndDate,
    decimal RentPrice,
    decimal DepositAmount,
    string Status);

public sealed class CreateLeaseRequest
{
    [Range(1, int.MaxValue)]
    public int TenantId { get; set; }

    [Range(1, int.MaxValue)]
    public int RoomId { get; set; }

    public DateTime StartDate { get; set; } = DateTime.Today;

    public DateTime EndDate { get; set; } = DateTime.Today.AddMonths(12);

    [Range(typeof(decimal), "0.01", "999999")]
    public decimal RentPrice { get; set; }

    [Range(typeof(decimal), "0", "999999")]
    public decimal DepositAmount { get; set; }
}
