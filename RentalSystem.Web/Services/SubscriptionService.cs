using Microsoft.EntityFrameworkCore;
using RentalSystem.Web.Data;
using RentalSystem.Web.Models;

namespace RentalSystem.Web.Services;

public interface ISubscriptionService
{
    Task<Subscription> GetOrCreateSubscriptionAsync(int organizationId, CancellationToken cancellationToken = default);
}

public sealed class MockSubscriptionService : ISubscriptionService
{
    private readonly RentalDbContext _context;
    private readonly ILogger<MockSubscriptionService> _logger;

    public MockSubscriptionService(RentalDbContext context, ILogger<MockSubscriptionService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<Subscription> GetOrCreateSubscriptionAsync(int organizationId, CancellationToken cancellationToken = default)
    {
        var existing = await _context.Subscriptions
            .FirstOrDefaultAsync(s => s.OrganizationId == organizationId, cancellationToken);

        if (existing != null)
        {
            return existing;
        }

        var subscription = new Subscription
        {
            OrganizationId = organizationId,
            Tier = SubscriptionTier.Free,
            Status = SubscriptionStatus.Active,
            StartDateUtc = DateTime.UtcNow,
            MonthlyPrice = 0m,
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow
        };

        _context.Subscriptions.Add(subscription);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Created default free subscription for organization {OrganizationId}.", organizationId);
        return subscription;
    }
}
