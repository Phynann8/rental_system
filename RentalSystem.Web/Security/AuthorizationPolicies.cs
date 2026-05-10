using Microsoft.AspNetCore.Authorization;

namespace RentalSystem.Web.Security;

public static class AuthorizationPolicies
{
    public const string DashboardRead = nameof(DashboardRead);
    public const string PropertyManagement = nameof(PropertyManagement);
    public const string BillingOperations = nameof(BillingOperations);
    public const string UserAdministration = nameof(UserAdministration);
    public const string TenantOnly = nameof(TenantOnly);

    public static void AddPolicies(AuthorizationOptions options)
    {
        options.AddPolicy(
            TenantOnly,
            policy => policy.RequireRole(AppRoles.Tenant));
        options.AddPolicy(
            DashboardRead,
            policy => policy.RequireRole(AppRoles.Admin, AppRoles.Manager, AppRoles.Billing));

        options.AddPolicy(
            PropertyManagement,
            policy => policy.RequireRole(AppRoles.Admin, AppRoles.Manager));

        options.AddPolicy(
            BillingOperations,
            policy => policy.RequireRole(AppRoles.Admin, AppRoles.Manager, AppRoles.Billing));

        options.AddPolicy(
            UserAdministration,
            policy => policy.RequireRole(AppRoles.Admin));
    }
}
