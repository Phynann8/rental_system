using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using RentalSystem.Web.Data;
using RentalSystem.Web.Models;
using RentalSystem.Web.Options;
using RentalSystem.Web.Security;

namespace RentalSystem.Tests;

public sealed class AuthControllerTests
{
    private RentalDbContext CreateTestDbContext()
    {
        var options = new DbContextOptionsBuilder<RentalDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        var mockOrgProvider = new Mock<IOrganizationProvider>();
        mockOrgProvider.Setup(x => x.OrganizationId).Returns(1);

        return new RentalDbContext(options, mockOrgProvider.Object);
    }

    private AuthService CreateAuthService(RentalDbContext context)
    {
        var passwordHasher = new PasswordHasher<UserAccount>();
        var options = Options.Create(new AuthOptions());
        return new AuthService(context, passwordHasher, options);
    }

    [Fact]
    public async Task PasswordSignInAsync_WithValidCredentials_ReturnsSuccessfulLogin()
    {
        // Arrange
        using var context = CreateTestDbContext();
        var passwordHasher = new PasswordHasher<UserAccount>();
        var password = "Test@1234";
        
        var user = new UserAccount
        {
            Username = "testuser",
            NormalizedUsername = "TESTUSER",
            Email = "test@example.com",
            NormalizedEmail = "TEST@EXAMPLE.COM",
            PasswordHash = passwordHasher.HashPassword(null!, password),
            IsActive = true,
            AccessFailedCount = 0,
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow
        };

        context.UserAccounts.Add(user);
        await context.SaveChangesAsync();

        var authService = CreateAuthService(context);

        // Act
        var result = await authService.PasswordSignInAsync(
            user.Username,
            password,
            rememberMe: false,
            ipAddress: "127.0.0.1",
            userAgent: "Test",
            CancellationToken.None);

        // Assert
        Assert.True(result.Succeeded);
        Assert.NotNull(result.Session);
        Assert.Equal(user.Id, result.Session.UserId);
    }

    [Fact]
    public async Task PasswordSignInAsync_WithInvalidPassword_ReturnsFailed()
    {
        // Arrange
        using var context = CreateTestDbContext();
        var passwordHasher = new PasswordHasher<UserAccount>();
        var correctPassword = "CorrectPassword123";
        
        var user = new UserAccount
        {
            Username = "testuser",
            NormalizedUsername = "TESTUSER",
            Email = "test@example.com",
            NormalizedEmail = "TEST@EXAMPLE.COM",
            PasswordHash = passwordHasher.HashPassword(null!, correctPassword),
            IsActive = true,
            AccessFailedCount = 0,
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow
        };

        context.UserAccounts.Add(user);
        await context.SaveChangesAsync();

        var authService = CreateAuthService(context);

        // Act
        var result = await authService.PasswordSignInAsync(
            user.Username,
            "WrongPassword",
            rememberMe: false,
            ipAddress: "127.0.0.1",
            userAgent: "Test",
            CancellationToken.None);

        // Assert
        Assert.False(result.Succeeded);
        Assert.Null(result.Session);
        Assert.NotNull(result.ErrorMessage);
    }

    [Fact]
    public async Task PasswordSignInAsync_WithInactiveUser_ReturnsFailed()
    {
        // Arrange
        using var context = CreateTestDbContext();
        var passwordHasher = new PasswordHasher<UserAccount>();
        var password = "Test@1234";
        
        var user = new UserAccount
        {
            Username = "testuser",
            NormalizedUsername = "TESTUSER",
            Email = "test@example.com",
            NormalizedEmail = "TEST@EXAMPLE.COM",
            PasswordHash = passwordHasher.HashPassword(null!, password),
            IsActive = false,
            AccessFailedCount = 0,
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow
        };

        context.UserAccounts.Add(user);
        await context.SaveChangesAsync();

        var authService = CreateAuthService(context);

        // Act
        var result = await authService.PasswordSignInAsync(
            user.Username,
            password,
            rememberMe: false,
            ipAddress: "127.0.0.1",
            userAgent: "Test",
            CancellationToken.None);

        // Assert
        Assert.False(result.Succeeded);
        Assert.NotNull(result.ErrorMessage);
        Assert.Contains("Invalid username/email or password.", result.ErrorMessage);
    }

    [Fact]
    public async Task PasswordSignInAsync_WithLockedOutUser_ReturnsFailed()
    {
        // Arrange
        using var context = CreateTestDbContext();
        var passwordHasher = new PasswordHasher<UserAccount>();
        var password = "Test@1234";
        
        var user = new UserAccount
        {
            Username = "testuser",
            NormalizedUsername = "TESTUSER",
            Email = "test@example.com",
            NormalizedEmail = "TEST@EXAMPLE.COM",
            PasswordHash = passwordHasher.HashPassword(null!, password),
            IsActive = true,
            LockoutEndUtc = DateTime.UtcNow.AddMinutes(15),
            AccessFailedCount = 5,
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow
        };

        context.UserAccounts.Add(user);
        await context.SaveChangesAsync();

        var authService = CreateAuthService(context);

        // Act
        var result = await authService.PasswordSignInAsync(
            user.Username,
            password,
            rememberMe: false,
            ipAddress: "127.0.0.1",
            userAgent: "Test",
            CancellationToken.None);

        // Assert
        Assert.False(result.Succeeded);
        Assert.NotNull(result.ErrorMessage);
        Assert.Contains("locked", result.ErrorMessage);
    }

    [Fact]
    public async Task PasswordSignInAsync_WithNonexistentUser_ReturnsFailed()
    {
        // Arrange
        using var context = CreateTestDbContext();
        var authService = CreateAuthService(context);

        // Act
        var result = await authService.PasswordSignInAsync(
            "nonexistent",
            "password",
            rememberMe: false,
            ipAddress: "127.0.0.1",
            userAgent: "Test",
            CancellationToken.None);

        // Assert
        Assert.False(result.Succeeded);
        Assert.Null(result.Session);
    }

    [Fact]
    public async Task PasswordSignInAsync_CreatesSessionWithExpiry()
    {
        // Arrange
        using var context = CreateTestDbContext();
        var passwordHasher = new PasswordHasher<UserAccount>();
        var password = "Test@1234";
        
        var user = new UserAccount
        {
            Username = "testuser",
            NormalizedUsername = "TESTUSER",
            Email = "test@example.com",
            NormalizedEmail = "TEST@EXAMPLE.COM",
            PasswordHash = passwordHasher.HashPassword(null!, password),
            IsActive = true,
            AccessFailedCount = 0,
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow
        };

        context.UserAccounts.Add(user);
        await context.SaveChangesAsync();

        var authService = CreateAuthService(context);

        // Act
        var result = await authService.PasswordSignInAsync(
            user.Username,
            password,
            rememberMe: false,
            ipAddress: "127.0.0.1",
            userAgent: "Test Client",
            CancellationToken.None);

        // Assert
        Assert.True(result.Succeeded);
        var session = result.Session;
        Assert.NotNull(session);
        Assert.NotEqual(Guid.Empty, session.SessionId);
        Assert.True(session.ExpiresAtUtc > DateTime.UtcNow);
    }
}