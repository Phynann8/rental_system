using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using RentalSystem.Web.Data;
using RentalSystem.Web.Models;

namespace RentalSystem.Web.Services;

public sealed class NotificationService : INotificationService
{
    private readonly RentalDbContext _context;

    public NotificationService(RentalDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<Notification>> GetUnreadNotificationsAsync()
    {
        return await _context.Notifications
            .AsNoTracking()
            .Where(n => !n.IsRead)
            .OrderByDescending(n => n.CreatedAtUtc)
            .ToListAsync();
    }

    public async Task<IReadOnlyList<Notification>> GetAllNotificationsAsync(int limit = 50)
    {
        return await _context.Notifications
            .AsNoTracking()
            .OrderByDescending(n => n.CreatedAtUtc)
            .Take(limit)
            .ToListAsync();
    }

    public async Task MarkAsReadAsync(int id)
    {
        var notification = await _context.Notifications.FirstOrDefaultAsync(n => n.Id == id);
        if (notification != null && !notification.IsRead)
        {
            notification.IsRead = true;
            await _context.SaveChangesAsync();
        }
    }

    public async Task MarkAllAsReadAsync()
    {
        var unreadNotifications = await _context.Notifications
            .Where(n => !n.IsRead)
            .ToListAsync();

        if (unreadNotifications.Any())
        {
            foreach (var notification in unreadNotifications)
            {
                notification.IsRead = true;
            }
            await _context.SaveChangesAsync();
        }
    }

    // Usually used internally or by background worker
    public async Task CreateNotificationAsync(int organizationId, string title, string message, NotificationType type, string? linkUri = null)
    {
        var notification = new Notification
        {
            OrganizationId = organizationId,
            Title = title,
            Message = message,
            Type = type,
            IsRead = false,
            CreatedAtUtc = DateTime.UtcNow,
            LinkUri = linkUri
        };

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();
    }
}
