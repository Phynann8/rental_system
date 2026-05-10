using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using RentalSystem.Web.Options;
using RentalSystem.Web.Security;

namespace RentalSystem.Web.Data;

public static class AuthSeedData
{
    public static async Task InitializeAsync(IServiceProvider services, ILogger logger, IHostEnvironment environment, CancellationToken cancellationToken = default)
    {
        await using var scope = services.CreateAsyncScope();
        var context = scope.ServiceProvider.GetRequiredService<RentalDbContext>();
        var options = scope.ServiceProvider.GetRequiredService<IOptions<AuthOptions>>().Value;
        var passwordHasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher<UserAccount>>();

        if (environment.IsDevelopment())
        {
            await EnsureDevelopmentUsersAsync(context, passwordHasher, cancellationToken);
            return;
        }

        await EnsureBootstrapAdminAsync(context, passwordHasher, options.BootstrapAdmin, logger, cancellationToken);
    }

    private static async Task EnsureDevelopmentUsersAsync(
        RentalDbContext context,
        IPasswordHasher<UserAccount> passwordHasher,
        CancellationToken cancellationToken)
    {
        await EnsureUserAsync(context, passwordHasher, "admin", "admin@rentalmgr.local", "System Admin", "Admin123!", AppRoles.Admin, cancellationToken);
        await EnsureUserAsync(context, passwordHasher, "manager", "manager@rentalmgr.local", "Operations Manager", "Rental123!", AppRoles.Manager, cancellationToken);
        await EnsureUserAsync(context, passwordHasher, "billing", "billing@rentalmgr.local", "Billing Officer", "Billing123!", AppRoles.Billing, cancellationToken);
    }

    private static async Task EnsureBootstrapAdminAsync(
        RentalDbContext context,
        IPasswordHasher<UserAccount> passwordHasher,
        BootstrapAdminOptions bootstrapAdmin,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        if (await context.UserAccounts.AnyAsync(cancellationToken))
        {
            return;
        }

        if (string.IsNullOrWhiteSpace(bootstrapAdmin.Username)
            || string.IsNullOrWhiteSpace(bootstrapAdmin.Email)
            || string.IsNullOrWhiteSpace(bootstrapAdmin.Password))
        {
            logger.LogWarning(
                "No user accounts exist and BootstrapAdmin credentials are not configured. Set Auth:BootstrapAdmin to create the first admin account.");
            return;
        }

        await EnsureUserAsync(
            context,
            passwordHasher,
            bootstrapAdmin.Username,
            bootstrapAdmin.Email,
            string.IsNullOrWhiteSpace(bootstrapAdmin.DisplayName) ? bootstrapAdmin.Username : bootstrapAdmin.DisplayName,
            bootstrapAdmin.Password,
            AppRoles.Admin,
            cancellationToken);
    }

    private static async Task EnsureUserAsync(
        RentalDbContext context,
        IPasswordHasher<UserAccount> passwordHasher,
        string username,
        string email,
        string displayName,
        string password,
        string role,
        CancellationToken cancellationToken)
    {
        var normalizedUsername = username.Trim().ToUpperInvariant();
        var existingUser = await context.UserAccounts.IgnoreQueryFilters().FirstOrDefaultAsync(
            user => user.NormalizedUsername == normalizedUsername,
            cancellationToken);

        if (existingUser != null)
        {
            return;
        }

        // Fetch default organization
        var defaultOrg = await context.Organizations.IgnoreQueryFilters()
            .FirstOrDefaultAsync(o => o.Name == "Default Organization", cancellationToken);
            
        if (defaultOrg == null)
        {
            throw new InvalidOperationException("Default Organization must be created before seeding users.");
        }

        var now = DateTime.UtcNow;
        var user = new UserAccount
        {
            OrganizationId = defaultOrg.Id,
            Username = username.Trim(),
            NormalizedUsername = normalizedUsername,
            Email = email.Trim(),
            NormalizedEmail = email.Trim().ToUpperInvariant(),
            DisplayName = displayName.Trim(),
            Role = role,
            CreatedAtUtc = now,
            UpdatedAtUtc = now,
            IsActive = true
        };

        user.PasswordHash = passwordHasher.HashPassword(user, password);
        context.UserAccounts.Add(user);
        await context.SaveChangesAsync(cancellationToken);
    }
}
