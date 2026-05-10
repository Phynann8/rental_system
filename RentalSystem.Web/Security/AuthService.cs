using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using RentalSystem.Web.Data;
using RentalSystem.Web.Models;
using RentalSystem.Web.Options;

namespace RentalSystem.Web.Security;

public sealed class AuthService
{
    private readonly RentalDbContext _context;
    private readonly IPasswordHasher<UserAccount> _passwordHasher;
    private readonly AuthOptions _options;

    public AuthService(
        RentalDbContext context,
        IPasswordHasher<UserAccount> passwordHasher,
        IOptions<AuthOptions> options)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _options = options.Value;
    }

    public async Task<LoginResult> PasswordSignInAsync(string usernameOrEmail, string password, bool rememberMe, string? ipAddress, string? userAgent, CancellationToken cancellationToken = default)
    {
        var user = await FindUserForLoginAsync(usernameOrEmail, cancellationToken);
        var now = DateTime.UtcNow;
        if (user == null || !user.IsActive) return LoginResult.Fail("Invalid username/email or password.");

        if (IsLockedOut(user, now)) return LoginResult.Fail($"This account is locked until {user.LockoutEndUtc:yyyy-MM-dd HH:mm} UTC.");

        var verification = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, password);
        if (verification == PasswordVerificationResult.Failed)
        {
            await RegisterFailedAttemptAsync(user, now, cancellationToken);
            return LoginResult.Fail(IsLockedOut(user, now) ? $"This account is locked until {user.LockoutEndUtc:yyyy-MM-dd HH:mm} UTC." : "Invalid username/email or password.");
        }

        user.AccessFailedCount = 0;
        user.LockoutEndUtc = null;
        user.LastLoginAtUtc = now;
        user.UpdatedAtUtc = now;

        if (verification == PasswordVerificationResult.SuccessRehashNeeded) user.PasswordHash = _passwordHasher.HashPassword(user, password);

        var session = new UserSession { UserAccountId = user.Id, CreatedAtUtc = now, LastSeenAtUtc = now, ExpiresAtUtc = now.Add(GetIdleTimeout()), IpAddress = Truncate(ipAddress, 45), UserAgent = Truncate(userAgent, 512) };
        _context.UserSessions.Add(session);
        await _context.SaveChangesAsync(cancellationToken);

        return LoginResult.Success(MapSession(user, session), CreatePrincipal(user, session.Id), CreateAuthenticationProperties(session.ExpiresAtUtc, rememberMe));
    }

    public async Task<AuthSessionDto?> GetSessionAsync(ClaimsPrincipal principal, DateTimeOffset? expiresUtc = null, CancellationToken cancellationToken = default)
    {
        var ids = GetPrincipalIds(principal);
        if (ids == null) return null;

        var session = await _context.UserSessions
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Include(s => s.UserAccount)
            .FirstOrDefaultAsync(s => s.Id == ids.Value.SessionId && s.UserAccountId == ids.Value.UserId, cancellationToken);
        if (session?.UserAccount == null || session.RevokedAtUtc.HasValue || session.ExpiresAtUtc <= DateTime.UtcNow || !session.UserAccount.IsActive) return null;

        return MapSession(session.UserAccount, session, expiresUtc?.UtcDateTime);
    }

    public async Task<SessionValidationResult> ValidateSessionAsync(ClaimsPrincipal principal, DateTimeOffset? currentCookieExpiry, CancellationToken cancellationToken = default)
    {
        var ids = GetPrincipalIds(principal);
        if (ids == null) return SessionValidationResult.Invalid;

        var session = await _context.UserSessions
            .IgnoreQueryFilters()
            .Include(s => s.UserAccount)
            .FirstOrDefaultAsync(s => s.Id == ids.Value.SessionId && s.UserAccountId == ids.Value.UserId, cancellationToken);
        var now = DateTime.UtcNow;

        if (session?.UserAccount == null || session.RevokedAtUtc.HasValue || session.ExpiresAtUtc <= now || !session.UserAccount.IsActive || IsLockedOut(session.UserAccount, now))
        {
            if (session is { RevokedAtUtc: null } && session.ExpiresAtUtc <= now)
            {
                session.RevokedAtUtc = now;
                session.RevokedReason = "Expired";
                await _context.SaveChangesAsync(cancellationToken);
            }
            return SessionValidationResult.Invalid;
        }

        var validationInterval = TimeSpan.FromMinutes(Math.Max(1, _options.Session.ValidationIntervalMinutes));
        if (session.LastSeenAtUtc > now.Subtract(validationInterval))
        {
            var effectiveExpiry = currentCookieExpiry?.UtcDateTime > session.ExpiresAtUtc ? currentCookieExpiry.Value.UtcDateTime : session.ExpiresAtUtc;
            return SessionValidationResult.Valid(new DateTimeOffset(effectiveExpiry), false);
        }

        session.LastSeenAtUtc = now;
        session.ExpiresAtUtc = now.Add(GetIdleTimeout());
        await _context.SaveChangesAsync(cancellationToken);
        return SessionValidationResult.Valid(new DateTimeOffset(session.ExpiresAtUtc), true);
    }

    public async Task SignOutCurrentSessionAsync(ClaimsPrincipal principal, string reason, CancellationToken cancellationToken = default)
    {
        var ids = GetPrincipalIds(principal);
        if (ids == null) return;
        var session = await _context.UserSessions
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(s => s.Id == ids.Value.SessionId && s.UserAccountId == ids.Value.UserId, cancellationToken);
        if (session != null && !session.RevokedAtUtc.HasValue) {
            session.RevokedAtUtc = DateTime.UtcNow;
            session.RevokedReason = Truncate(reason, 200);
            await _context.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task<IReadOnlyList<UserSessionDto>> GetSessionsAsync(Guid userId, Guid? currentSessionId, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        return await _context.UserSessions
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(s => s.UserAccountId == userId && !s.RevokedAtUtc.HasValue && s.ExpiresAtUtc > now)
            .OrderByDescending(s => s.CreatedAtUtc)
            .Select(s => new UserSessionDto(s.Id, s.CreatedAtUtc, s.LastSeenAtUtc, s.ExpiresAtUtc, s.Id == currentSessionId, s.UserAgent, s.IpAddress))
            .ToListAsync(cancellationToken);
    }

    public async Task<OperationResult> ChangePasswordAsync(Guid userId, string currentPassword, string newPassword, Guid? currentSessionId, CancellationToken cancellationToken = default)
    {
        var user = await _context.UserAccounts.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
        if (user == null || !user.IsActive) return OperationResult.Fail("User not found.");
        if (_passwordHasher.VerifyHashedPassword(user, user.PasswordHash, currentPassword) == PasswordVerificationResult.Failed) return OperationResult.Fail("Current password is incorrect.");

        var errors = ValidatePassword(newPassword);
        if (errors.Count > 0) return OperationResult.Fail(string.Join(" ", errors));

        var now = DateTime.UtcNow;
        user.PasswordHash = _passwordHasher.HashPassword(user, newPassword);
        user.LastPasswordChangeAtUtc = now; 
        user.UpdatedAtUtc = now;
        user.AccessFailedCount = 0; user.LockoutEndUtc = null;

        await _context.SaveChangesAsync(cancellationToken);
        await RevokeSessionsAsync(userId, "Password changed", currentSessionId, cancellationToken);
        return OperationResult.Ok();
    }

    public async Task<OperationResult<AuthSessionDto>> RegisterOrganizationAsync(RegisterCommand command, string? ipAddress, string? userAgent, CancellationToken cancellationToken = default)
    {
        var orgName = command.OrganizationName.Trim();
        var normalizedEmail = Normalize(command.Email);
        if (string.IsNullOrWhiteSpace(orgName)) return OperationResult<AuthSessionDto>.Fail("Organization name required.");
        if (await _context.Organizations.AnyAsync(o => o.Name == orgName, cancellationToken)) return OperationResult<AuthSessionDto>.Fail("Org exists.");
        if (await _context.UserAccounts.IgnoreQueryFilters().AnyAsync(u => u.NormalizedEmail == normalizedEmail, cancellationToken)) return OperationResult<AuthSessionDto>.Fail("Email in use.");

        var errors = ValidatePassword(command.Password);
        if (errors.Count > 0) return OperationResult<AuthSessionDto>.Fail(string.Join(" ", errors));

        using var trans = await _context.Database.BeginTransactionAsync(cancellationToken);
        try {
            var now = DateTime.UtcNow;
            var org = new Organization { Name = orgName, SubscriptionTier = "Pro", CreatedAtUtc = now, IsActive = true };
            _context.Organizations.Add(org); await _context.SaveChangesAsync(cancellationToken);

            var user = new UserAccount { OrganizationId = org.Id, Username = command.Username.Trim(), NormalizedUsername = Normalize(command.Username), Email = command.Email.Trim(), NormalizedEmail = normalizedEmail, DisplayName = command.DisplayName.Trim(), Role = AppRoles.Admin, CreatedAtUtc = now, UpdatedAtUtc = now, IsActive = true };
            user.PasswordHash = _passwordHasher.HashPassword(user, command.Password);
            _context.UserAccounts.Add(user);

            _context.Subscriptions.Add(new Subscription { OrganizationId = org.Id, Tier = SubscriptionTier.Pro, Status = SubscriptionStatus.Active, StartDateUtc = now, TrialEndsUtc = now.AddDays(30), MonthlyPrice = 49.99m, CreatedAtUtc = now, UpdatedAtUtc = now });
            await _context.SaveChangesAsync(cancellationToken); await trans.CommitAsync(cancellationToken);

            var session = new UserSession { UserAccountId = user.Id, CreatedAtUtc = now, LastSeenAtUtc = now, ExpiresAtUtc = now.Add(GetIdleTimeout()), IpAddress = Truncate(ipAddress, 45), UserAgent = Truncate(userAgent, 512) };
            _context.UserSessions.Add(session); await _context.SaveChangesAsync(cancellationToken);
            return OperationResult<AuthSessionDto>.Ok(MapSession(user, session));
        } catch { await trans.RollbackAsync(cancellationToken); throw; }
    }

    public async Task<IReadOnlyList<UserAccountDto>> GetUsersAsync(CancellationToken cancellationToken = default) {
        var now = DateTime.UtcNow;
        return await _context.UserAccounts.AsNoTracking().OrderBy(u => u.DisplayName)
            .Select(u => new UserAccountDto(u.Id, u.Username, u.Email, u.DisplayName, u.Role, u.IsActive, u.LockoutEndUtc.HasValue && u.LockoutEndUtc > now, u.CreatedAtUtc, u.LastLoginAtUtc))
            .ToListAsync(cancellationToken);
    }

    public async Task<CreateUserResult> CreateUserAsync(CreateUserCommand command, CancellationToken cancellationToken = default) {
        if (!AppRoles.IsValid(command.Role)) return CreateUserResult.Fail("Role invalid.");
        var errors = ValidatePassword(command.Password); if (errors.Count > 0) return CreateUserResult.Fail(string.Join(" ", errors));
        var nu = Normalize(command.Username); var ne = Normalize(command.Email);
        if (await _context.UserAccounts.AnyAsync(u => u.NormalizedUsername == nu || u.NormalizedEmail == ne, cancellationToken)) return CreateUserResult.Fail("Taken.");

        var user = new UserAccount { OrganizationId = command.OrganizationId, Username = command.Username.Trim(), NormalizedUsername = nu, Email = command.Email.Trim(), NormalizedEmail = ne, DisplayName = command.DisplayName.Trim(), Role = AppRoles.Normalize(command.Role), CreatedAtUtc = DateTime.UtcNow, UpdatedAtUtc = DateTime.UtcNow, IsActive = command.IsActive };
        user.PasswordHash = _passwordHasher.HashPassword(user, command.Password);
        _context.UserAccounts.Add(user); await _context.SaveChangesAsync(cancellationToken);
        return CreateUserResult.Success(new UserAccountDto(user.Id, user.Username, user.Email, user.DisplayName, user.Role, user.IsActive, false, user.CreatedAtUtc, user.LastLoginAtUtc));
    }

    public async Task<UpdateUserResult> UpdateUserAsync(Guid userId, UpdateUserCommand command, CancellationToken cancellationToken = default) {
        var user = await _context.UserAccounts.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
        if (user == null) return UpdateUserResult.Fail("Not found.");
        var nu = Normalize(command.Username); var ne = Normalize(command.Email);
        if (await _context.UserAccounts.AnyAsync(u => u.Id != userId && (u.NormalizedUsername == nu || u.NormalizedEmail == ne), cancellationToken)) return UpdateUserResult.Fail("Taken.");

        user.Username = command.Username.Trim(); user.NormalizedUsername = nu; user.Email = command.Email.Trim(); user.NormalizedEmail = ne; user.DisplayName = command.DisplayName.Trim(); user.Role = AppRoles.Normalize(command.Role); user.IsActive = command.IsActive; user.UpdatedAtUtc = DateTime.UtcNow;
        user.LockoutEndUtc = !command.IsActive ? DateTime.UtcNow.AddYears(100) : (user.LockoutEndUtc > DateTime.UtcNow.AddYears(50) ? null : user.LockoutEndUtc);
        await _context.SaveChangesAsync(cancellationToken);
        return UpdateUserResult.Success(new UserAccountDto(user.Id, user.Username, user.Email, user.DisplayName, user.Role, user.IsActive, user.LockoutEndUtc > DateTime.UtcNow, user.CreatedAtUtc, user.LastLoginAtUtc));
    }

    public async Task<OperationResult> ResetPasswordAsync(Guid userId, string newPassword, CancellationToken cancellationToken = default) {
        var user = await _context.UserAccounts.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
        if (user == null) return OperationResult.Fail("Not found.");
        var errors = ValidatePassword(newPassword); if (errors.Count > 0) return OperationResult.Fail(string.Join(" ", errors));
        user.PasswordHash = _passwordHasher.HashPassword(user, newPassword); user.LastPasswordChangeAtUtc = DateTime.UtcNow; user.UpdatedAtUtc = DateTime.UtcNow; user.AccessFailedCount = 0; user.LockoutEndUtc = null;
        await _context.SaveChangesAsync(cancellationToken); return OperationResult.Ok();
    }

    public async Task<OperationResult<string>> CreateTenantSetupTokenAsync(int tenantId, string email, string displayName, CancellationToken cancellationToken = default) {
        var tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.Id == tenantId, cancellationToken);
        if (tenant == null) return OperationResult<string>.Fail("Tenant not found.");
        var ne = Normalize(email); if (await _context.UserAccounts.AnyAsync(u => u.NormalizedEmail == ne, cancellationToken)) return OperationResult<string>.Fail("Used.");

        var user = new UserAccount { OrganizationId = tenant.OrganizationId, TenantId = tenantId, Email = email, NormalizedEmail = ne, Username = email, NormalizedUsername = ne, DisplayName = displayName, Role = AppRoles.Tenant, IsActive = true, CreatedAtUtc = DateTime.UtcNow, UpdatedAtUtc = DateTime.UtcNow, SetupToken = Guid.NewGuid(), SetupTokenExpiresAtUtc = DateTime.UtcNow.AddMinutes(30), PasswordHash = "PENDING" };
        _context.UserAccounts.Add(user); await _context.SaveChangesAsync(cancellationToken);
        return OperationResult<string>.Ok(user.SetupToken.ToString()!);
    }

    public async Task<OperationResult> CompleteSetupAsync(Guid token, string password, CancellationToken cancellationToken = default) {
        var user = await _context.UserAccounts.FirstOrDefaultAsync(u => u.SetupToken == token && u.SetupTokenExpiresAtUtc > DateTime.UtcNow, cancellationToken);
        if (user == null) return OperationResult.Fail("Invalid token.");
        var errors = ValidatePassword(password); if (errors.Count > 0) return OperationResult.Fail(string.Join(" ", errors));
        user.PasswordHash = _passwordHasher.HashPassword(user, password); user.SetupToken = null; user.SetupTokenExpiresAtUtc = null; user.LastPasswordChangeAtUtc = DateTime.UtcNow; user.UpdatedAtUtc = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken); return OperationResult.Ok();
    }

    public async Task RevokeAllSessionsAsync(Guid userId, string reason, Guid? exceptSessionId = null, CancellationToken cancellationToken = default) => await RevokeSessionsAsync(userId, reason, exceptSessionId, cancellationToken);
    public async Task<bool> RevokeOwnedSessionAsync(Guid userId, Guid sessionId, string reason, CancellationToken cancellationToken = default) {
        var s = await _context.UserSessions
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserAccountId == userId, cancellationToken);
        if (s == null || s.RevokedAtUtc.HasValue) return false;
        s.RevokedAtUtc = DateTime.UtcNow; s.RevokedReason = Truncate(reason, 200);
        await _context.SaveChangesAsync(cancellationToken); return true;
    }

    public Guid? GetCurrentUserId(ClaimsPrincipal p) => Guid.TryParse(p.FindFirstValue(ClaimTypes.NameIdentifier), out var v) ? v : null;
    public Guid? GetCurrentSessionId(ClaimsPrincipal p) => Guid.TryParse(p.FindFirstValue(AuthClaimTypes.SessionId), out var v) ? v : null;

    public ClaimsPrincipal CreatePrincipal(UserAccount u, Guid sid) {
        var c = new List<Claim> { new(ClaimTypes.NameIdentifier, u.Id.ToString()), new(ClaimTypes.Name, u.Username), new(ClaimTypes.GivenName, u.DisplayName), new(ClaimTypes.Role, u.Role), new(AuthClaimTypes.SessionId, sid.ToString()), new(AuthClaimTypes.Email, u.Email), new(AuthClaimTypes.DisplayName, u.DisplayName), new(AuthClaimTypes.OrganizationId, u.OrganizationId.ToString()) };
        return new ClaimsPrincipal(new ClaimsIdentity(c, CookieAuthenticationDefaults.AuthenticationScheme));
    }

    public AuthenticationProperties CreateAuthenticationProperties(DateTime expiry, bool persistent) => new() { IsPersistent = persistent, AllowRefresh = true, IssuedUtc = DateTimeOffset.UtcNow, ExpiresUtc = new DateTimeOffset(expiry) };

    private string Normalize(string v) => v.Trim().ToUpperInvariant();
    private async Task<UserAccount?> FindUserForLoginAsync(string uOrE, CancellationToken ct) {
        var n = Normalize(uOrE); return await _context.UserAccounts.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.NormalizedUsername == n || u.NormalizedEmail == n, ct);
    }

    private async Task RegisterFailedAttemptAsync(UserAccount u, DateTime now, CancellationToken ct) {
        u.AccessFailedCount += 1; u.UpdatedAtUtc = now;
        if (u.AccessFailedCount >= _options.Lockout.MaxFailedAccessAttempts) u.LockoutEndUtc = now.AddMinutes(_options.Lockout.LockoutMinutes);
        await _context.SaveChangesAsync(ct);
    }

    private bool IsLockedOut(UserAccount u, DateTime now) => u.LockoutEndUtc.HasValue && u.LockoutEndUtc.Value > now;
    private TimeSpan GetIdleTimeout() => TimeSpan.FromMinutes(Math.Max(15, _options.Session.IdleTimeoutMinutes));

    private List<string> ValidatePassword(string p) {
        var e = new List<string>(); var po = _options.Password;
        if (string.IsNullOrWhiteSpace(p)) { e.Add("Required."); return e; }
        if (p.Length < po.RequiredLength) e.Add("Length.");
        if (p.Distinct().Count() < po.RequiredUniqueChars) e.Add("Uniq.");
        if (po.RequireUppercase && !p.Any(char.IsUpper)) e.Add("Upper.");
        if (po.RequireLowercase && !p.Any(char.IsLower)) e.Add("Lower.");
        if (po.RequireDigit && !p.Any(char.IsDigit)) e.Add("Digit.");
        if (po.RequireNonAlphanumeric && p.All(char.IsLetterOrDigit)) e.Add("Special.");
        return e;
    }

    private async Task RevokeSessionsAsync(Guid uid, string r, Guid? esid, CancellationToken ct) {
        var now = DateTime.UtcNow; var rt = Truncate(r, 200);
        await _context.UserSessions
            .IgnoreQueryFilters()
            .Where(s => s.UserAccountId == uid && !s.RevokedAtUtc.HasValue && (!esid.HasValue || s.Id != esid.Value))
            .ExecuteUpdateAsync(s => s.SetProperty(p => p.RevokedAtUtc, now).SetProperty(p => p.RevokedReason, rt), ct);
    }

    private static (Guid UserId, Guid SessionId)? GetPrincipalIds(ClaimsPrincipal p) {
        var u = p.FindFirstValue(ClaimTypes.NameIdentifier); var s = p.FindFirstValue(AuthClaimTypes.SessionId);
        return Guid.TryParse(u, out var uid) && Guid.TryParse(s, out var sid) ? (uid, sid) : null;
    }

    private static AuthSessionDto MapSession(UserAccount u, UserSession s, DateTime? expiry = null) => new(u.Id, u.Username, u.Email, u.DisplayName, new[] { u.Role }, s.Id, expiry ?? s.ExpiresAtUtc);
    private static string? Truncate(string? v, int l) => string.IsNullOrWhiteSpace(v) ? null : (v.Length <= l ? v : v[..l]);
}
