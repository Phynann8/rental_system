using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RentalSystem.Web.Models;
using RentalSystem.Web.Security;
using RentalSystem.Web.Services;

namespace RentalSystem.Web.Controllers;

[ApiController]
[Authorize] // Notification can be seen by standard users as long as they are authenticated
[Route("api/notifications")]
public sealed class NotificationsController : ControllerBase
{
    private readonly INotificationService _notificationService;
    private readonly ILogger<NotificationsController> _logger;

    public NotificationsController(INotificationService notificationService, ILogger<NotificationsController> logger)
    {
        _notificationService = notificationService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<NotificationDto>>> GetNotifications([FromQuery] bool unreadOnly = false)
    {
        try
        {
            var notifications = unreadOnly 
                ? await _notificationService.GetUnreadNotificationsAsync() 
                : await _notificationService.GetAllNotificationsAsync();

            var dtos = notifications.Select(n => new NotificationDto(n.Id, n.Title, n.Message, n.Type.ToString(), n.IsRead, n.CreatedAtUtc, n.LinkUri)).ToList();
            return Ok(dtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching notifications");
            return StatusCode(500, new { message = "Error fetching notifications", details = ex.Message });
        }
    }

    [HttpPut("{id:int}/read")]
    public async Task<ActionResult> MarkAsRead(int id)
    {
        await _notificationService.MarkAsReadAsync(id);
        return NoContent();
    }

    [HttpPut("read-all")]
    public async Task<ActionResult> MarkAllAsRead()
    {
        await _notificationService.MarkAllAsReadAsync();
        return NoContent();
    }
}

public sealed record NotificationDto(int Id, string Title, string Message, string Type, bool IsRead, DateTime CreatedAtUtc, string? LinkUri);
