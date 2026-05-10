using Microsoft.EntityFrameworkCore;
using System.Diagnostics;

namespace RentalSystem.Web.Data;

public static class DatabaseStartup
{
    private const string DevelopmentConnectionString =
        "Server=(localdb)\\MSSQLLocalDB;Database=RentalSystemDb;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True";

    public sealed record DatabaseConfiguration(string? ConnectionString, bool UseInMemory, string? Reason = null);

    public static DatabaseConfiguration ResolveDatabaseConfiguration(IConfiguration configuration, IHostEnvironment environment)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection");
        if (!string.IsNullOrWhiteSpace(connectionString))
        {
            return new DatabaseConfiguration(connectionString, UseInMemory: false);
        }

        if (environment.IsDevelopment())
        {
            if (CanUseLocalDb())
            {
                return new DatabaseConfiguration(DevelopmentConnectionString, UseInMemory: false);
            }

            return new DatabaseConfiguration(
                ConnectionString: null,
                UseInMemory: true,
                Reason: "LocalDB is unavailable. Falling back to the in-memory provider for development startup.");
        }

        throw new InvalidOperationException(
            "Connection string 'DefaultConnection' is required. Configure it with dotnet user-secrets or the ConnectionStrings__DefaultConnection environment variable.");
    }

    public static void ConfigureDbContext(DbContextOptionsBuilder options, DatabaseConfiguration databaseConfiguration)
    {
        if (databaseConfiguration.UseInMemory)
        {
            options.UseInMemoryDatabase("RentalSystemDev");
            return;
        }

        options.UseSqlServer(databaseConfiguration.ConnectionString);
    }

    public static async Task InitializeDevelopmentDatabaseAsync(IServiceProvider services, CancellationToken cancellationToken = default)
    {
        await using var scope = services.CreateAsyncScope();
        var context = scope.ServiceProvider.GetRequiredService<RentalDbContext>();

        if (context.Database.IsRelational())
        {
            await context.Database.MigrateAsync(cancellationToken);
        }
        else
        {
            await context.Database.EnsureCreatedAsync(cancellationToken);
        }

        DbInitializer.Initialize(context);
    }

    public static bool HasHttpsEndpoint(IConfiguration configuration)
    {
        var urlsValue = configuration["urls"] ?? configuration["ASPNETCORE_URLS"];
        if (string.IsNullOrWhiteSpace(urlsValue))
        {
            return false;
        }

        return urlsValue
            .Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Any(url => url.StartsWith("https://", StringComparison.OrdinalIgnoreCase));
    }

    private static bool CanUseLocalDb()
    {
        try
        {
            var sqlLocalDbPath = GetSqlLocalDbPath();
            if (sqlLocalDbPath == null)
            {
                return false;
            }

            using var process = Process.Start(new ProcessStartInfo
            {
                FileName = sqlLocalDbPath,
                Arguments = "i MSSQLLocalDB",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            });

            if (process == null)
            {
                return false;
            }

            if (!process.WaitForExit(3000))
            {
                try
                {
                    process.Kill(entireProcessTree: true);
                }
                catch
                {
                    // Best effort only.
                }

                return false;
            }

            var output = $"{process.StandardOutput.ReadToEnd()} {process.StandardError.ReadToEnd()}";
            return process.ExitCode == 0
                && !output.Contains("failed", StringComparison.OrdinalIgnoreCase)
                && !output.Contains("error", StringComparison.OrdinalIgnoreCase);
        }
        catch
        {
            return false;
        }
    }

    private static string? GetSqlLocalDbPath()
    {
        var programFiles = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles);
        var candidate = Path.Combine(programFiles, "Microsoft SQL Server", "170", "Tools", "Binn", "SqlLocalDB.exe");
        return File.Exists(candidate) ? candidate : null;
    }
}
