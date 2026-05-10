using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using RentalSystem.Web.Data;
using RentalSystem.Web.Models;
using RentalSystem.Web.Services;

namespace RentalSystem.Web.Workers;

public sealed class NotificationBackgroundWorker : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<NotificationBackgroundWorker> _logger;

    public NotificationBackgroundWorker(IServiceProvider serviceProvider, ILogger<NotificationBackgroundWorker> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Notification Background Worker started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessChecksAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during notification processing.");
            }

            // Run daily checks (we use 1 hr here for dev/robustness to catch changes, but normally 24h)
            await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
        }
    }

    private async Task ProcessChecksAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<RentalDbContext>();
        var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

        var today = DateTime.Today;

        // 1. Check for Overdue Invoices
        var overdueInvoices = await context.Invoices
            .Include(i => i.Contract).ThenInclude(c => c!.Tenant)
            .Include(i => i.Contract).ThenInclude(c => c!.Room)
            .Where(i => i.Status != InvoiceStatus.Paid && i.DueDate < today)
            .ToListAsync(cancellationToken);

        foreach (var invoice in overdueInvoices)
        {
            var alreadyNotified = await context.Notifications.AnyAsync(n => 
                n.Type == NotificationType.Warning && n.LinkUri == $"/invoices?id={invoice.Id}", cancellationToken);

            if (!alreadyNotified)
            {
                var tenantName = invoice.Contract?.Tenant?.Name ?? "Unknown";
                var roomNum = invoice.Contract?.Room?.RoomNumber ?? "Unknown";
                
                await notificationService.CreateNotificationAsync(
                    invoice.OrganizationId,
                    "Invoice Overdue",
                    $"Invoice #{invoice.Id} for room {roomNum} (Tenant: {tenantName}) is overdue.",
                    NotificationType.Warning,
                    $"/invoices?id={invoice.Id}"
                );
            }
        }

        // 2. Check for Leases Expiring soon (e.g. within 30 days)
        var thirtyDaysFromNow = today.AddDays(30);
        var expiringLeases = await context.Contracts
            .Include(c => c.Tenant)
            .Include(c => c.Room)
            .Where(c => c.Status == ContractStatus.Active && c.EndDate <= thirtyDaysFromNow)
            .ToListAsync(cancellationToken);

        foreach (var lease in expiringLeases)
        {
            var alreadyNotified = await context.Notifications.AnyAsync(n => 
                n.Type == NotificationType.Info && n.LinkUri == $"/tenants?id={lease.TenantId}", cancellationToken);

            if (!alreadyNotified)
            {
                var tenantName = lease.Tenant?.Name ?? "Unknown";
                var roomNum = lease.Room?.RoomNumber ?? "Unknown";
                
                await notificationService.CreateNotificationAsync(
                    lease.OrganizationId,
                    "Lease Expiring Soon",
                    $"Lease for room {roomNum} (Tenant: {tenantName}) expires on {lease.EndDate:yyyy-MM-dd}.",
                    NotificationType.Info,
                    $"/tenants?id={lease.TenantId}"
                );
            }
        }
    }
}
