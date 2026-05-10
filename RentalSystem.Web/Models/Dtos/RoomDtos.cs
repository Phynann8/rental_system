using System.ComponentModel.DataAnnotations;
using RentalSystem.Web.Models;

namespace RentalSystem.Web.Models.Dtos;

public sealed record RoomDto(
    int Id,
    int BuildingId,
    int RoomTypeId,
    string RoomNumber,
    string Building,
    int Floor,
    string Type,
    decimal Rent,
    string Status,
    string? Tenant,
    string? LeaseEnd,
    bool Overdue);

public sealed record RoomTypeLookupDto(int Id, string Name, decimal BasePrice);
public sealed record RoomLookupResponse(IReadOnlyList<LookupDto> Buildings, IReadOnlyList<RoomTypeLookupDto> RoomTypes);

public sealed class UpsertRoomRequest
{
    [Range(1, int.MaxValue)]
    public int BuildingId { get; set; }

    [Range(1, int.MaxValue)]
    public int RoomTypeId { get; set; }

    [Required]
    [StringLength(20)]
    public string RoomNumber { get; set; } = string.Empty;

    public int Floor { get; set; }

    [Required]
    public RoomStatus Status { get; set; } = RoomStatus.Vacant;
}
