using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using RentalSystem.Web.Data;
using RentalSystem.Web.Models;
using RentalSystem.Web.Models.Dtos;

namespace RentalSystem.Web.Services;

public interface IMaintenanceService
{
    Task<IReadOnlyList<MaintenanceTicketDto>> GetTicketsAsync(int? buildingId, string? status);
    Task<MaintenanceTicketDto?> GetTicketAsync(int id);
    Task<MaintenanceTicketDto> CreateTicketAsync(UpsertMaintenanceRequest request);
    Task<MaintenanceTicketDto?> UpdateTicketAsync(int id, UpdateMaintenanceRequest request);
    Task<bool> DeleteTicketAsync(int id);
}

public class MaintenanceService : IMaintenanceService
{
    private readonly RentalDbContext _context;
    private readonly INotificationService _notificationService;

    public MaintenanceService(RentalDbContext context, INotificationService notificationService)
    {
        _context = context;
        _notificationService = notificationService;
    }

    public async Task<IReadOnlyList<MaintenanceTicketDto>> GetTicketsAsync(int? buildingId, string? status)
    {
        IQueryable<MaintenanceTicket> query = _context.MaintenanceTickets
            .AsNoTracking()
            .Include(t => t.Room).ThenInclude(r => r!.Building)
            .Include(t => t.Tenant);

        if (buildingId.HasValue)
        {
            query = query.Where(t => t.Room != null && t.Room.BuildingId == buildingId.Value);
        }

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<MaintenanceStatus>(status, true, out var parsedStatus))
        {
            query = query.Where(t => t.Status == parsedStatus);
        }

        var tickets = await query
            .OrderByDescending(t => t.CreatedAtUtc)
            .ToListAsync();

        return tickets.Select(MapToDto).ToList();
    }

    public async Task<MaintenanceTicketDto?> GetTicketAsync(int id)
    {
        var ticket = await _context.MaintenanceTickets
            .AsNoTracking()
            .Include(t => t.Room).ThenInclude(r => r!.Building)
            .Include(t => t.Tenant)
            .FirstOrDefaultAsync(t => t.Id == id);

        return ticket == null ? null : MapToDto(ticket);
    }

    public async Task<MaintenanceTicketDto> CreateTicketAsync(UpsertMaintenanceRequest request)
    {
        var room = await _context.Rooms.FirstOrDefaultAsync(r => r.Id == request.RoomId);
        if (room == null) throw new ArgumentException("Room not found.");

        var ticket = new MaintenanceTicket
        {
            RoomId = request.RoomId,
            TenantId = request.TenantId,
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            Priority = request.Priority,
            Status = MaintenanceStatus.Open,
            CreatedAtUtc = DateTime.UtcNow
        };

        _context.MaintenanceTickets.Add(ticket);
        await _context.SaveChangesAsync();

        await _notificationService.CreateNotificationAsync(
            room.OrganizationId,
            "New Maintenance Ticket",
            $"New {ticket.Priority} priority ticket: {ticket.Title} for room {room.RoomNumber}.",
            ticket.Priority == MaintenancePriority.Critical || ticket.Priority == MaintenancePriority.High ? NotificationType.Error : NotificationType.Info,
            $"/maintenance?id={ticket.Id}"
        );

        return MapToDto(ticket);
    }

    public async Task<MaintenanceTicketDto?> UpdateTicketAsync(int id, UpdateMaintenanceRequest request)
    {
        var ticket = await _context.MaintenanceTickets
            .Include(t => t.Room).ThenInclude(r => r!.Building)
            .Include(t => t.Tenant)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (ticket == null) return null;

        ticket.Title = request.Title.Trim();
        ticket.Description = request.Description.Trim();
        ticket.Priority = request.Priority;
        
        if (request.AssignedTo != null) 
            ticket.AssignedTo = request.AssignedTo.Trim();

        var oldStatus = ticket.Status;

        if (ticket.Status != request.Status)
        {
            ticket.Status = request.Status;
            
            if (request.Status == MaintenanceStatus.Resolved || request.Status == MaintenanceStatus.Cancelled)
            {
                ticket.ResolvedAtUtc = DateTime.UtcNow;
                if (!string.IsNullOrWhiteSpace(request.ResolutionNotes))
                    ticket.ResolutionNotes = request.ResolutionNotes.Trim();
            }
            else
            {
                ticket.ResolvedAtUtc = null;
                ticket.ResolutionNotes = null;
            }
        }
        else if (request.Status == MaintenanceStatus.Resolved && !string.IsNullOrWhiteSpace(request.ResolutionNotes))
        {
             ticket.ResolutionNotes = request.ResolutionNotes.Trim();
        }

        await _context.SaveChangesAsync();

        if (ticket.Status == MaintenanceStatus.Resolved && oldStatus != MaintenanceStatus.Resolved)
        {
            await _notificationService.CreateNotificationAsync(
            ticket.Room!.OrganizationId,
            "Ticket Resolved",
            $"Ticket #{ticket.Id} for room {ticket.Room?.RoomNumber} has been resolved.",
            NotificationType.Info,
            $"/maintenance?id={ticket.Id}"
        );
        }

        return MapToDto(ticket);
    }

    public async Task<bool> DeleteTicketAsync(int id)
    {
        var ticket = await _context.MaintenanceTickets.FirstOrDefaultAsync(t => t.Id == id);
        if (ticket == null) return false;

        _context.MaintenanceTickets.Remove(ticket);
        await _context.SaveChangesAsync();
        return true;
    }

    private static MaintenanceTicketDto MapToDto(MaintenanceTicket t)
    {
        return new MaintenanceTicketDto(
            t.Id,
            t.RoomId,
            t.Room?.RoomNumber ?? "Unknown",
            t.Room?.Building?.Name ?? "Unknown Building",
            t.Room?.BuildingId ?? 0,
            t.TenantId,
            t.Tenant?.Name,
            t.Title,
            t.Description,
            t.Status.ToString(),
            t.Priority.ToString(),
            t.CreatedAtUtc,
            t.ResolvedAtUtc,
            t.AssignedTo,
            t.ResolutionNotes
        );
    }
}
