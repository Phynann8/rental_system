using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using System.ComponentModel.DataAnnotations;

namespace RentalSystem.Web.Security;

public sealed record AuthSessionDto(
    Guid UserId,
    string Username,
    string Email,
    string DisplayName,
    IReadOnlyList<string> Roles,
    Guid SessionId,
    DateTime ExpiresAtUtc);

public sealed record UserSessionDto(
    Guid Id,
    DateTime CreatedAtUtc,
    DateTime LastSeenAtUtc,
    DateTime ExpiresAtUtc,
    bool IsCurrent,
    string? UserAgent,
    string? IpAddress);

public sealed record UserAccountDto(
    Guid Id,
    string Username,
    string Email,
    string DisplayName,
    string Role,
    bool IsActive,
    bool IsLockedOut,
    DateTime CreatedAtUtc,
    DateTime? LastLoginAtUtc);

public sealed record LoginResult(
    string? ErrorMessage,
    AuthSessionDto? Session = null,
    ClaimsPrincipal? Principal = null,
    AuthenticationProperties? Properties = null)
{
    public bool Succeeded => Session != null;
    public static LoginResult Fail(string msg) => new(msg);
    public static LoginResult Success(AuthSessionDto session, ClaimsPrincipal principal, AuthenticationProperties props) 
        => new(null, session, principal, props);
}

public sealed record SessionValidationResult(
    bool IsValid,
    DateTimeOffset? ExpiresUtc = null,
    bool ShouldRenew = false)
{
    public static SessionValidationResult Invalid => new(false);
    public static SessionValidationResult Valid(DateTimeOffset expiry, bool shouldRenew) 
        => new(true, expiry, shouldRenew);
}

public sealed record OperationResult(bool Succeeded, string? ErrorMessage = null)
{
    public static OperationResult Ok() => new(true);
    public static OperationResult Fail(string msg) => new(false, msg);
}

public sealed record OperationResult<T>(bool Succeeded, T? Value = default, string? ErrorMessage = null)
{
    public static OperationResult<T> Ok(T value) => new(true, value);
    public static OperationResult<T> Fail(string msg) => new(false, default, msg);
}

public sealed record RegisterCommand(
    string OrganizationName,
    string Username,
    string Email,
    string Password,
    string DisplayName);

public sealed record CreateUserCommand(
    int OrganizationId,
    string Username,
    string Email,
    string Password,
    string DisplayName,
    string Role,
    bool IsActive);

public sealed record UpdateUserCommand(
    string Username,
    string Email,
    string DisplayName,
    string Role,
    bool IsActive);

public sealed record CreateUserResult(bool Succeeded, UserAccountDto? User = null, string? ErrorMessage = null)
{
    public static CreateUserResult Success(UserAccountDto user) => new(true, user);
    public static CreateUserResult Fail(string msg) => new(false, null, msg);
}

public sealed record UpdateUserResult(bool Succeeded, UserAccountDto? User = null, string? ErrorMessage = null)
{
    public static UpdateUserResult Success(UserAccountDto user) => new(true, user);
    public static UpdateUserResult Fail(string msg) => new(false, null, msg);
}

public sealed class SetupLinkRequest
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string DisplayName { get; set; } = string.Empty;
}

public sealed class CompleteSetupRequest
{
    [Required]
    public string Token { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;
}

public sealed class LoginRequest
{
    [Required]
    public string Username { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;

    public bool RememberMe { get; set; }
}

public sealed class ChangePasswordRequest
{
    [Required]
    public string CurrentPassword { get; set; } = string.Empty;

    [Required]
    public string NewPassword { get; set; } = string.Empty;
}

public sealed class CreateUserRequest
{
    [Required]
    [StringLength(50)]
    public string Username { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [StringLength(256)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [StringLength(100)]
    public string DisplayName { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;

    [Required]
    public string Role { get; set; } = "Manager";

    public bool IsActive { get; set; } = true;
}

public sealed class UpdateUserRequest
{
    [Required]
    [StringLength(50)]
    public string Username { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [StringLength(256)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [StringLength(100)]
    public string DisplayName { get; set; } = string.Empty;

    [Required]
    public string Role { get; set; } = "Manager";

    public bool IsActive { get; set; } = true;
}

public sealed class ResetPasswordRequest
{
    [Required]
    public string NewPassword { get; set; } = string.Empty;
}

public sealed class RegisterRequest
{
    [Required]
    [StringLength(100)]
    public string OrganizationName { get; set; } = string.Empty;

    [Required]
    [StringLength(50)]
    public string Username { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [StringLength(256)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [StringLength(100)]
    public string DisplayName { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;
}
