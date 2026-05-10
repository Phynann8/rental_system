namespace RentalSystem.Web.Options;

public sealed class AuthOptions
{
    public const string SectionName = "Auth";

    public PasswordPolicyOptions Password { get; set; } = new();
    public LockoutPolicyOptions Lockout { get; set; } = new();
    public SessionPolicyOptions Session { get; set; } = new();
    public BootstrapAdminOptions BootstrapAdmin { get; set; } = new();
}

public sealed class PasswordPolicyOptions
{
    public int RequiredLength { get; set; } = 10;
    public int RequiredUniqueChars { get; set; } = 4;
    public bool RequireDigit { get; set; } = true;
    public bool RequireLowercase { get; set; } = true;
    public bool RequireUppercase { get; set; } = true;
    public bool RequireNonAlphanumeric { get; set; } = true;
}

public sealed class LockoutPolicyOptions
{
    public int MaxFailedAccessAttempts { get; set; } = 5;
    public int LockoutMinutes { get; set; } = 15;
}

public sealed class SessionPolicyOptions
{
    public int IdleTimeoutMinutes { get; set; } = 480;
    public int ValidationIntervalMinutes { get; set; } = 5;
}

public sealed class BootstrapAdminOptions
{
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
}
