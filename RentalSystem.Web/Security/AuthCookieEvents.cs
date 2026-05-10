using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;

namespace RentalSystem.Web.Security;

public sealed class AuthCookieEvents : CookieAuthenticationEvents
{
    private readonly AuthService _authService;

    public AuthCookieEvents(AuthService authService)
    {
        _authService = authService;
    }

    public override async Task ValidatePrincipal(CookieValidatePrincipalContext context)
    {
        var validation = await _authService.ValidateSessionAsync(
            context.Principal!,
            context.Properties.ExpiresUtc,
            context.HttpContext.RequestAborted);

        if (!validation.IsValid)
        {
            context.RejectPrincipal();
            await context.HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return;
        }

        if (!validation.ShouldRenew)
        {
            return;
        }

        context.ShouldRenew = true;
        context.Properties.IssuedUtc = DateTimeOffset.UtcNow;
        context.Properties.ExpiresUtc = validation.ExpiresUtc;
    }

    public override Task RedirectToLogin(RedirectContext<CookieAuthenticationOptions> context)
    {
        if (context.Request.Path.StartsWithSegments("/api"))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return Task.CompletedTask;
        }

        context.Response.Redirect(context.RedirectUri);
        return Task.CompletedTask;
    }

    public override Task RedirectToAccessDenied(RedirectContext<CookieAuthenticationOptions> context)
    {
        if (context.Request.Path.StartsWithSegments("/api"))
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            return Task.CompletedTask;
        }

        context.Response.Redirect(context.RedirectUri);
        return Task.CompletedTask;
    }
}
