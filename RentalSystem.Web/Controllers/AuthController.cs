using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using RentalSystem.Web.Security;
using RentalSystem.Web.Models;

namespace RentalSystem.Web.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController : ControllerBase
{
    private readonly AuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(AuthService authService, ILogger<AuthController> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<ActionResult<AuthSessionDto>> Login([FromBody] LoginRequest request, CancellationToken cancellationToken)
    {
        var login = await _authService.PasswordSignInAsync(
            request.Username,
            request.Password,
            request.RememberMe,
            HttpContext.Connection.RemoteIpAddress?.ToString(),
            Request.Headers.UserAgent.ToString(),
            cancellationToken);

        if (!login.Succeeded || login.Principal == null || login.Properties == null || login.Session == null)
            return Unauthorized(new { message = login.ErrorMessage ?? "Unable to sign in." });

        await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, login.Principal, login.Properties);
        return Ok(login.Session);
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout(CancellationToken cancellationToken)
    {
        await _authService.SignOutCurrentSessionAsync(User, "Signed out", cancellationToken);
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return NoContent();
    }

    [Authorize]
    [HttpPost("logout-all")]
    public async Task<IActionResult> LogoutAll(CancellationToken cancellationToken)
    {
        var userId = _authService.GetCurrentUserId(User);
        if (userId == null) return Unauthorized(new { message = "Session is not valid." });

        await _authService.RevokeAllSessionsAsync(userId.Value, "Signed out from all devices", null, cancellationToken);
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return NoContent();
    }

    [HttpGet("me")]
    public async Task<ActionResult<AuthSessionDto>> Me(CancellationToken cancellationToken)
    {
        try
        {
            if (User.Identity?.IsAuthenticated != true) return NoContent();

            var authResult = await HttpContext.AuthenticateAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            var session = await _authService.GetSessionAsync(User, authResult.Properties?.ExpiresUtc, cancellationToken);
            
            if (session == null) return NoContent();
            return Ok(session);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in GetMe");
            return StatusCode(500, new { message = "An internal error occurred while retrieving session." });
        }
    }

    [AllowAnonymous]
    [HttpPost("register")]
    public async Task<ActionResult<AuthSessionDto>> Register([FromBody] RegisterRequest request)
    {
        var result = await _authService.RegisterOrganizationAsync(new RegisterCommand(request.OrganizationName, request.Username, request.Email, request.Password, request.DisplayName), HttpContext.Connection.RemoteIpAddress?.ToString(), Request.Headers.UserAgent.ToString());
        if (!result.Succeeded) return BadRequest(new { message = result.ErrorMessage });
        return Ok(result.Value);
    }

    [HttpGet("session")]
    public async Task<ActionResult<IReadOnlyList<UserSessionDto>>> GetSessions(CancellationToken cancellationToken)
    {
        var userId = _authService.GetCurrentUserId(User);
        if (userId == null) return Unauthorized(new { message = "Session is not valid." });
        return Ok(await _authService.GetSessionsAsync(userId.Value, _authService.GetCurrentSessionId(User), cancellationToken));
    }

    [Authorize]
    [HttpDelete("sessions/{sessionId:guid}")]
    public async Task<IActionResult> RevokeSession(Guid sessionId, CancellationToken cancellationToken)
    {
        var userId = _authService.GetCurrentUserId(User);
        var currentSessionId = _authService.GetCurrentSessionId(User);
        if (userId == null) return Unauthorized(new { message = "Session is not valid." });

        if (!await _authService.RevokeOwnedSessionAsync(userId.Value, sessionId, "Revoked by user", cancellationToken)) return NotFound();
        if (currentSessionId == sessionId) await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return NoContent();
    }

    [Authorize]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request, CancellationToken cancellationToken)
    {
        var userId = _authService.GetCurrentUserId(User);
        if (userId == null) return Unauthorized(new { message = "Session is not valid." });
        var result = await _authService.ChangePasswordAsync(userId.Value, request.CurrentPassword, request.NewPassword, _authService.GetCurrentSessionId(User), cancellationToken);
        if (!result.Succeeded) return BadRequest(new { message = result.ErrorMessage });
        return NoContent();
    }

    [Authorize(Policy = AuthorizationPolicies.UserAdministration)]
    [HttpGet("users")]
    public async Task<ActionResult<IReadOnlyList<UserAccountDto>>> GetUsers(CancellationToken cancellationToken) => Ok(await _authService.GetUsersAsync(cancellationToken));

    [Authorize(Policy = AuthorizationPolicies.UserAdministration)]
    [HttpPost("users")]
    public async Task<ActionResult<UserAccountDto>> CreateUser([FromBody] CreateUserRequest request, CancellationToken cancellationToken)
    {
        var orgIdClaim = User.FindFirst(AuthClaimTypes.OrganizationId)?.Value;
        if (!int.TryParse(orgIdClaim, out var orgId)) return Unauthorized(new { message = "Organization context missing." });
        var result = await _authService.CreateUserAsync(new CreateUserCommand(orgId, request.Username, request.Email, request.Password, request.DisplayName, request.Role, request.IsActive), cancellationToken);
        if (!result.Succeeded || result.User == null) return BadRequest(new { message = result.ErrorMessage });
        return Created($"/api/auth/users/{result.User.Id}", result.User);
    }

    [Authorize(Policy = AuthorizationPolicies.UserAdministration)]
    [HttpPut("users/{userId:guid}")]
    public async Task<ActionResult<UserAccountDto>> UpdateUser(Guid userId, [FromBody] UpdateUserRequest request, CancellationToken cancellationToken)
    {
        var result = await _authService.UpdateUserAsync(userId, new UpdateUserCommand(request.Username, request.Email, request.DisplayName, request.Role, request.IsActive), cancellationToken);
        if (!result.Succeeded) return BadRequest(new { message = result.ErrorMessage });
        return Ok(result.User);
    }

    [Authorize(Policy = AuthorizationPolicies.UserAdministration)]
    [HttpPost("users/{userId:guid}/reset-password")]
    public async Task<IActionResult> ResetPassword(Guid userId, [FromBody] ResetPasswordRequest request, CancellationToken cancellationToken)
    {
        var result = await _authService.ResetPasswordAsync(userId, request.NewPassword, cancellationToken);
        if (!result.Succeeded) return BadRequest(new { message = result.ErrorMessage });
        return NoContent();
    }

    [Authorize(Policy = AuthorizationPolicies.PropertyManagement)]
    [HttpPost("tenants/{tenantId:int}/setup-link")]
    public async Task<ActionResult<string>> CreateSetupLink(int tenantId, [FromBody] SetupLinkRequest request, CancellationToken cancellationToken)
    {
        var result = await _authService.CreateTenantSetupTokenAsync(tenantId, request.Email, request.DisplayName, cancellationToken);
        if (!result.Succeeded) return BadRequest(new { message = result.ErrorMessage });
        return Ok(new { token = result.Value });
    }

    [AllowAnonymous]
    [HttpPost("setup-complete")]
    public async Task<IActionResult> CompleteSetup([FromBody] CompleteSetupRequest request, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(request.Token, out var tokenGuid)) return BadRequest(new { message = "Invalid token format." });
        var result = await _authService.CompleteSetupAsync(tokenGuid, request.Password, cancellationToken);
        if (!result.Succeeded) return BadRequest(new { message = result.ErrorMessage });
        return Ok(new { message = "Account setup complete." });
    }
}
