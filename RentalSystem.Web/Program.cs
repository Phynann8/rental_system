using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc.Authorization;
using RentalSystem.Web.Data;
using RentalSystem.Web.Options;
using RentalSystem.Web.Security;
using RentalSystem.Web.Services;
using RentalSystem.Web.Workers;
using Serilog;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .CreateLogger();

builder.Host.UseSerilog();

var databaseConfiguration = DatabaseStartup.ResolveDatabaseConfiguration(builder.Configuration, builder.Environment);

if (databaseConfiguration.UseInMemory && !string.IsNullOrWhiteSpace(databaseConfiguration.Reason))
{
    Log.Warning("{Reason}", databaseConfiguration.Reason);
}

// Add services to the container.
// Razor Pages used for server-rendered views under /Pages.
builder.Services.AddRazorPages(options =>
{
    options.Conventions.AuthorizeFolder("/");
    options.Conventions.AuthorizePage("/Index", AuthorizationPolicies.DashboardRead);
    options.Conventions.AuthorizeFolder("/Billing", AuthorizationPolicies.BillingOperations);
    options.Conventions.AuthorizeFolder("/Print", AuthorizationPolicies.BillingOperations);
    options.Conventions.AuthorizeFolder("/Reports", AuthorizationPolicies.DashboardRead);
    options.Conventions.AuthorizeFolder("/Configuration", AuthorizationPolicies.PropertyManagement);
    options.Conventions.AuthorizeFolder("/Tenancy", AuthorizationPolicies.PropertyManagement);
    options.Conventions.AuthorizeFolder("/Map", AuthorizationPolicies.PropertyManagement);
    options.Conventions.AuthorizeFolder("/Settings", AuthorizationPolicies.PropertyManagement);

    options.Conventions.AllowAnonymousToPage("/Error");
    options.Conventions.AllowAnonymousToPage("/Account/Login");
    options.Conventions.AllowAnonymousToPage("/Account/AccessDenied");
});
builder.Services
    .AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

builder.Services.Configure<AuthOptions>(builder.Configuration.GetSection(AuthOptions.SectionName));
builder.Services.AddScoped<IPasswordHasher<UserAccount>, PasswordHasher<UserAccount>>();
builder.Services.AddScoped<IOrganizationProvider, OrganizationProvider>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<AuthCookieEvents>();

// Register data integrity and transaction services
builder.Services.AddScoped<ITransactionService, TransactionService>();
builder.Services.AddScoped<IPaymentService, PaymentService>();
builder.Services.AddScoped<IInvoiceService, InvoiceService>();
builder.Services.AddScoped<IContractService, ContractService>();
builder.Services.AddScoped<IInvoicePdfService, InvoicePdfService>();
builder.Services.AddScoped<IReportService, ReportService>();
builder.Services.AddScoped<IExcelExportService, ExcelExportService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddScoped<IMaintenanceService, MaintenanceService>();
builder.Services.AddScoped<ITenantDocumentService, TenantDocumentService>();
builder.Services.AddScoped<ITenantPortalService, TenantPortalService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<ISubscriptionService, MockSubscriptionService>();
builder.Services.AddScoped<IBillingService, MockBillingService>();
builder.Services.Configure<SmtpOptions>(builder.Configuration.GetSection(SmtpOptions.SectionName));
builder.Services.AddScoped<IMessagingService, SmtpMessagingService>();

builder.Services.AddHostedService<NotificationBackgroundWorker>();

builder.Services
    .AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.Cookie.Name = "rentalmgr.auth";
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.Cookie.SecurePolicy = builder.Environment.IsDevelopment()
            ? CookieSecurePolicy.SameAsRequest
            : CookieSecurePolicy.Always;
        options.SlidingExpiration = true;
        options.ExpireTimeSpan = TimeSpan.FromMinutes(Math.Max(15, builder.Configuration.GetValue<int?>("Auth:Session:IdleTimeoutMinutes") ?? 480));
        options.LoginPath = "/Account/Login";
        options.AccessDeniedPath = "/Account/AccessDenied";
        options.EventsType = typeof(AuthCookieEvents);
    });
builder.Services.AddAuthorization(AuthorizationPolicies.AddPolicies);

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<AuditSaveChangesInterceptor>();

// Register EF DbContext with the resolved development/production provider.
// This is the core persistence layer for app data (buildings, rooms, tenants, invoices).
builder.Services.AddDbContext<RentalDbContext>((provider, options) => {
    DatabaseStartup.ConfigureDbContext(options, databaseConfiguration);
    options.AddInterceptors(provider.GetRequiredService<AuditSaveChangesInterceptor>());
});

// Swagger for API docs and API exploration for developers.
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Health Check monitoring
builder.Services.AddHealthChecks()
    .AddDbContextCheck<RentalDbContext>(name: "Database", tags: new[] { "db", "sql" });

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    await DatabaseStartup.InitializeDevelopmentDatabaseAsync(app.Services);
}

await AuthSeedData.InitializeAsync(app.Services, app.Logger, app.Environment);

// Configure the HTTP request pipeline.
// Production uses HSTS and custom error page. Development uses detailed exception pages.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "RentalSystem API V1");
        options.RoutePrefix = "swagger";
    });
}
else
{
    app.UseExceptionHandler("/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

if (DatabaseStartup.HasHttpsEndpoint(builder.Configuration))
{
    app.UseHttpsRedirection();
}

app.UseStaticFiles();

app.UseRouting();

// Add Serilog HTTP request logging
app.UseSerilogRequestLogging();

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapRazorPages();

// Health Check Endpoint
app.MapHealthChecks("/health", new HealthCheckOptions
{
    ResponseWriter = HealthCheckUtils.WriteResponse
});

app.Run();
