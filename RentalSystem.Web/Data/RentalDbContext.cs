using Microsoft.EntityFrameworkCore;
using RentalSystem.Web.Models;
using RentalSystem.Web.Security;

namespace RentalSystem.Web.Data
{
    public class RentalDbContext : DbContext
    {
        private readonly IOrganizationProvider _orgProvider;

        public RentalDbContext(DbContextOptions<RentalDbContext> options, IOrganizationProvider orgProvider) : base(options)
        {
            _orgProvider = orgProvider;
        }

        internal int? CurrentOrgId => _orgProvider.OrganizationId;

        public DbSet<Building> Buildings => Set<Building>();
        // DbSets for each aggregate root.
        // These are the tables in DB and should reflect models in RentalSystem.Web.Models.
        public DbSet<RoomType> RoomTypes => Set<RoomType>();
        public DbSet<Room> Rooms => Set<Room>();
        public DbSet<UtilityMeter> UtilityMeters => Set<UtilityMeter>();
        public DbSet<Tenant> Tenants => Set<Tenant>();
        public DbSet<Contract> Contracts => Set<Contract>();
        public DbSet<Invoice> Invoices => Set<Invoice>();
        public DbSet<InvoiceItem> InvoiceItems => Set<InvoiceItem>();
        public DbSet<Payment> Payments => Set<Payment>();
        public DbSet<UserAccount> UserAccounts => Set<UserAccount>();
        public DbSet<UserSession> UserSessions => Set<UserSession>();
        public DbSet<SystemSetting> SystemSettings => Set<SystemSetting>();
        public DbSet<TenantDocument> TenantDocuments => Set<TenantDocument>();
        public DbSet<Notification> Notifications => Set<Notification>();
        public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
        public DbSet<MaintenanceTicket> MaintenanceTickets => Set<MaintenanceTicket>();
        public DbSet<Organization> Organizations => Set<Organization>();
        public DbSet<Subscription> Subscriptions => Set<Subscription>();
        public DbSet<BillingTransaction> BillingTransactions => Set<BillingTransaction>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Keep precision for all financial fields at 18,2 to avoid rounding issues.
            base.OnModelCreating(modelBuilder);

            // Configure decimal precisions
            modelBuilder.Entity<RoomType>()
                .Property(r => r.BasePrice)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<Contract>()
                .Property(c => c.RentPrice)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<Contract>()
                .Property(c => c.DepositAmount)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<Invoice>()
                .Property(i => i.TotalAmount)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<InvoiceItem>()
                .Property(i => i.UnitPrice)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<InvoiceItem>()
                .Property(i => i.Total)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<Payment>()
                .Property(p => p.Amount)
                .HasColumnType("decimal(18,2)");

            // Configure SystemSettings precision
            modelBuilder.Entity<SystemSetting>()
                .Property(s => s.DefaultElectricityRate)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<SystemSetting>()
                .Property(s => s.DefaultWaterRate)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<SystemSetting>()
                .Property(s => s.ExchangeRateUsdToKhr)
                .HasColumnType("decimal(18,2)");

            // Seed default settings
            modelBuilder.Entity<SystemSetting>().HasData(
                new SystemSetting
                {
                    Id = 1,
                    CompanyName = "RentalMgr",
                    CurrencySymbol = "$",
                    DefaultInvoiceDueDays = 7,
                    DefaultElectricityRate = 1000m,
                    DefaultWaterRate = 1500m,
                    ExchangeRateUsdToKhr = 4100m
                }
            );

            // ====== USER ACCOUNT CONSTRAINTS ======
            modelBuilder.Entity<UserAccount>()
                .HasIndex(u => u.NormalizedUsername)
                .IsUnique();

            modelBuilder.Entity<UserAccount>()
                .HasIndex(u => u.NormalizedEmail)
                .IsUnique();

            modelBuilder.Entity<UserAccount>()
                .HasOne(u => u.Tenant)
                .WithMany()
                .HasForeignKey(u => u.TenantId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<UserAccount>()
                .Property(u => u.Role)
                .HasMaxLength(20);

            modelBuilder.Entity<UserSession>()
                .HasIndex(s => new { s.UserAccountId, s.ExpiresAtUtc });

            // ====== ROOM UNIQUENESS CONSTRAINT ======
            // Prevent duplicate room numbers within the same building.
            // Example: Building A can have Room 101, Building B can also have Room 101, but Building A cannot have two Room 101s.
            modelBuilder.Entity<Room>()
                .HasIndex(r => new { r.BuildingId, r.RoomNumber })
                .IsUnique()
                .HasDatabaseName("IX_Rooms_BuildingId_RoomNumber_Unique");

            // Performance index for frequent queries by building
            modelBuilder.Entity<Room>()
                .HasIndex(r => r.BuildingId)
                .HasDatabaseName("IX_Rooms_BuildingId");

            // Performance index for room status filters
            modelBuilder.Entity<Room>()
                .HasIndex(r => new { r.BuildingId, r.Status })
                .HasDatabaseName("IX_Rooms_BuildingId_Status");

            // ====== CONTRACT CONSTRAINTS ======
            // Index to efficiently check for active leases by tenant (prevent double-booking)
            modelBuilder.Entity<Contract>()
                .HasIndex(c => new { c.TenantId, c.Status })
                .HasDatabaseName("IX_Contracts_TenantId_Status");

            // Index to efficiently check for active leases by room (prevent double-booking)
            modelBuilder.Entity<Contract>()
                .HasIndex(c => new { c.RoomId, c.Status })
                .HasDatabaseName("IX_Contracts_RoomId_Status");

            // Index for date range queries
            modelBuilder.Entity<Contract>()
                .HasIndex(c => new { c.StartDate, c.EndDate })
                .HasDatabaseName("IX_Contracts_DateRanges");

            // ====== INVOICE UNIQUENESS AND IDEMPOTENCY ======
            // Unique constraint on InvoiceKey to prevent duplicate invoice generation.
            // InvoiceKey format: "{ContractId}_{YYYYMM}"
            // Using a database-level unique constraint ensures application-level concurrency is safe.
            modelBuilder.Entity<Invoice>()
                .HasIndex(i => i.InvoiceKey)
                .IsUnique()
                .HasDatabaseName("IX_Invoices_InvoiceKey_Unique");

            // Composite index for efficient invoice lookup by contract and date range
            modelBuilder.Entity<Invoice>()
                .HasIndex(i => new { i.ContractId, i.Date })
                .HasDatabaseName("IX_Invoices_ContractId_Date");

            // Index for status-based queries (e.g., find unpaid invoices)
            modelBuilder.Entity<Invoice>()
                .HasIndex(i => new { i.Status, i.DueDate })
                .HasDatabaseName("IX_Invoices_Status_DueDate");

            // Configure RowVersion (timestamp) for concurrency control
            modelBuilder.Entity<Invoice>()
                .Property(i => i.RowVersion)
                .IsRowVersion();

            // ====== PAYMENT CONSTRAINTS ======
            // Index for efficient payment lookup by invoice
            modelBuilder.Entity<Payment>()
                .HasIndex(p => p.InvoiceId)
                .HasDatabaseName("IX_Payments_InvoiceId");

            // Composite index for payment history tracking and audit
            modelBuilder.Entity<Payment>()
                .HasIndex(p => new { p.InvoiceId, p.Date })
                .HasDatabaseName("IX_Payments_InvoiceId_Date");

            // Configure RowVersion (timestamp) for concurrency control
            modelBuilder.Entity<Payment>()
                .Property(p => p.RowVersion)
                .IsRowVersion();

            // ====== UTILITY METER CONSTRAINTS ======
            // Index to quickly find readings by room and type (append-only history)
            modelBuilder.Entity<UtilityMeter>()
                .HasIndex(m => new { m.RoomId, m.Type })
                .HasDatabaseName("IX_UtilityMeters_RoomId_Type");

            // Index for last reading date queries
            modelBuilder.Entity<UtilityMeter>()
                .HasIndex(m => m.LastReadingDate)
                .HasDatabaseName("IX_UtilityMeters_LastReadingDate");

            // ====== AUDIT LOG CONSTRAINTS ======
            modelBuilder.Entity<AuditLog>()
                .HasIndex(a => a.TimestampUtc)
                .HasDatabaseName("IX_AuditLogs_Timestamp");

            modelBuilder.Entity<AuditLog>()
                .HasIndex(a => new { a.EntityName, a.TimestampUtc })
                .HasDatabaseName("IX_AuditLogs_EntityName_Timestamp");

            // ====== MAINTENANCE TICKET CONSTRAINTS ======
            modelBuilder.Entity<MaintenanceTicket>()
                .HasIndex(t => new { t.Status, t.Priority })
                .HasDatabaseName("IX_MaintenanceTickets_Status_Priority");

            modelBuilder.Entity<MaintenanceTicket>()
                .HasIndex(t => t.RoomId)
                .HasDatabaseName("IX_MaintenanceTickets_RoomId");

            modelBuilder.Entity<MaintenanceTicket>()
                .HasIndex(t => t.CreatedAtUtc)
                .HasDatabaseName("IX_MaintenanceTickets_CreatedAt");

            // ====== NOTIFICATION CONSTRAINTS ======
            modelBuilder.Entity<Notification>()
                .HasIndex(n => new { n.IsRead, n.CreatedAtUtc })
                .HasDatabaseName("IX_Notifications_IsRead_CreatedAt");

            // ====== ADDITIONAL PERFORMANCE INDEXES ======
            modelBuilder.Entity<Invoice>()
                .HasIndex(i => new { i.Status, i.Date })
                .HasDatabaseName("IX_Invoices_Status_Date");

            modelBuilder.Entity<Payment>()
                .HasIndex(p => p.Date)
                .HasDatabaseName("IX_Payments_Date");

            // ====== MULTI-TENANCY GLOBAL FILTERS ======
            // Apply the organization filter to all entities that implement ISaasScoped
            // Use property access so EF Core translates it as a dynamic parameter per execution
            
            modelBuilder.Entity<Organization>().HasQueryFilter(o => o.IsActive);
            
            modelBuilder.Entity<Building>().HasQueryFilter(b => b.OrganizationId == CurrentOrgId);
            modelBuilder.Entity<Room>().HasQueryFilter(r => r.OrganizationId == CurrentOrgId);
            modelBuilder.Entity<RoomType>().HasQueryFilter(rt => rt.OrganizationId == CurrentOrgId);
            modelBuilder.Entity<UtilityMeter>().HasQueryFilter(um => um.OrganizationId == CurrentOrgId);
            modelBuilder.Entity<Tenant>().HasQueryFilter(t => t.OrganizationId == CurrentOrgId);
            modelBuilder.Entity<Contract>().HasQueryFilter(c => c.OrganizationId == CurrentOrgId);
            modelBuilder.Entity<Invoice>().HasQueryFilter(i => i.OrganizationId == CurrentOrgId);
            modelBuilder.Entity<InvoiceItem>().HasQueryFilter(ii => ii.OrganizationId == CurrentOrgId);
            modelBuilder.Entity<Payment>().HasQueryFilter(p => p.OrganizationId == CurrentOrgId);
            modelBuilder.Entity<UserAccount>().HasQueryFilter(u => u.OrganizationId == CurrentOrgId);
            modelBuilder.Entity<SystemSetting>().HasQueryFilter(s => s.OrganizationId == CurrentOrgId);
            modelBuilder.Entity<TenantDocument>().HasQueryFilter(td => td.OrganizationId == CurrentOrgId);
            modelBuilder.Entity<Notification>().HasQueryFilter(n => n.OrganizationId == CurrentOrgId);
            modelBuilder.Entity<AuditLog>().HasQueryFilter(al => al.OrganizationId == CurrentOrgId);
            modelBuilder.Entity<MaintenanceTicket>().HasQueryFilter(mt => mt.OrganizationId == CurrentOrgId);
            modelBuilder.Entity<Subscription>().HasQueryFilter(s => s.OrganizationId == CurrentOrgId);
            modelBuilder.Entity<BillingTransaction>().HasQueryFilter(bt => bt.OrganizationId == CurrentOrgId);
            
            // Configure FK for UserAccount to Organization
            modelBuilder.Entity<UserAccount>()
                .HasOne(u => u.Organization)
                .WithMany()
                .HasForeignKey(u => u.OrganizationId)
                .OnDelete(DeleteBehavior.Restrict);
        }

        public override int SaveChanges()
        {
            ApplyOrganizationId();
            return base.SaveChanges();
        }

        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            ApplyOrganizationId();
            return base.SaveChangesAsync(cancellationToken);
        }

        private void ApplyOrganizationId()
        {
            var orgId = _orgProvider.OrganizationId;

            if (orgId.HasValue)
            {
                foreach (var entry in ChangeTracker.Entries<ISaasScoped>())
                {
                    if (entry.State == EntityState.Added)
                    {
                        entry.Entity.OrganizationId = orgId.Value;
                    }
                }
            }
        }
    }
}
