using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using RentalSystem.Web.Models;

namespace RentalSystem.Web.Models.Dtos;

public sealed record MaintenanceTicketDto(
    int Id,
    int RoomId,
    string RoomNumber,
    string BuildingName,
    int BuildingId,
    int? TenantId,
    string? TenantName,
    string Title,
    string Description,
    string Status,
    string Priority,
    DateTime CreatedAtUtc,
    DateTime? ResolvedAtUtc,
    string? AssignedTo,
    string? ResolutionNotes
);

public sealed class UpsertMaintenanceRequest
{
    [Range(1, int.MaxValue, ErrorMessage = "Room is required")]
    public int RoomId { get; set; }

    public int? TenantId { get; set; }

    [Required]
    [StringLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [StringLength(2000)]
    public string Description { get; set; } = string.Empty;

    public MaintenancePriority Priority { get; set; } = MaintenancePriority.Medium;
}

public sealed class UpdateMaintenanceRequest
{
    [Required]
    [StringLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [StringLength(2000)]
    public string Description { get; set; } = string.Empty;

    public MaintenancePriority Priority { get; set; } = MaintenancePriority.Medium;

    public MaintenanceStatus Status { get; set; }
    
    [StringLength(100)]
    public string? AssignedTo { get; set; }

    [StringLength(2000)]
    public string? ResolutionNotes { get; set; }
}
