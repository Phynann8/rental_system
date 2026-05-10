using System.Collections.Generic;
using System.Threading.Tasks;
using RentalSystem.Web.Models;

namespace RentalSystem.Web.Services;

public interface INotificationService
{
    Task<IReadOnlyList<Notification>> GetUnreadNotificationsAsync();
    Task<IReadOnlyList<Notification>> GetAllNotificationsAsync(int limit = 50);
    Task MarkAsReadAsync(int id);
    Task MarkAllAsReadAsync();
    Task CreateNotificationAsync(int organizationId, string title, string message, NotificationType type, string? linkUri = null);
}
