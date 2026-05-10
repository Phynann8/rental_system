namespace RentalSystem.Web.Security;

public static class AppRoles
{
    public const string Admin = "Admin";
    public const string Manager = "Manager";
    public const string Billing = "Billing";
    public const string Tenant = "Tenant";

    public static readonly IReadOnlyList<string> All = new[] { Admin, Manager, Billing, Tenant };

    public static bool IsValid(string? role)
    {
        return !string.IsNullOrWhiteSpace(role)
            && All.Contains(role.Trim(), StringComparer.OrdinalIgnoreCase);
    }

    public static string Normalize(string role)
    {
        var trimmed = role.Trim();

        return All.First(candidate => string.Equals(candidate, trimmed, StringComparison.OrdinalIgnoreCase));
    }
}
