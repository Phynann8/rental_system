using Microsoft.EntityFrameworkCore;
using RentalSystem.Web.Models;

namespace RentalSystem.Web.Data
{
    public static class DbInitializer
    {
        public static void Initialize(RentalDbContext context)
        {
            // ====== SAAS SEEDING ======
            // Ensure at least one organization exists
            var defaultOrg = context.Organizations.IgnoreQueryFilters().FirstOrDefault(o => o.Name == "Default Organization");
            if (defaultOrg == null)
            {
                defaultOrg = new Organization
                {
                    Name = "Default Organization",
                    SubscriptionTier = "Standard",
                    CreatedAtUtc = DateTime.UtcNow,
                    IsActive = true
                };
                context.Organizations.Add(defaultOrg);
                context.SaveChanges();
            }

            // If there's existing relational data with OrganizationId = 0 (from the migration's default value),
            // map it to the default organization.
            if (context.Database.IsRelational())
            {
                context.Database.ExecuteSqlInterpolated($"UPDATE Buildings SET OrganizationId = {defaultOrg.Id} WHERE OrganizationId = 0");
                context.Database.ExecuteSqlInterpolated($"UPDATE Rooms SET OrganizationId = {defaultOrg.Id} WHERE OrganizationId = 0");
                context.Database.ExecuteSqlInterpolated($"UPDATE RoomTypes SET OrganizationId = {defaultOrg.Id} WHERE OrganizationId = 0");
                context.Database.ExecuteSqlInterpolated($"UPDATE Tenants SET OrganizationId = {defaultOrg.Id} WHERE OrganizationId = 0");
                context.Database.ExecuteSqlInterpolated($"UPDATE UtilityMeters SET OrganizationId = {defaultOrg.Id} WHERE OrganizationId = 0");
                context.Database.ExecuteSqlInterpolated($"UPDATE Contracts SET OrganizationId = {defaultOrg.Id} WHERE OrganizationId = 0");
                context.Database.ExecuteSqlInterpolated($"UPDATE Invoices SET OrganizationId = {defaultOrg.Id} WHERE OrganizationId = 0");
                context.Database.ExecuteSqlInterpolated($"UPDATE InvoiceItems SET OrganizationId = {defaultOrg.Id} WHERE OrganizationId = 0");
                context.Database.ExecuteSqlInterpolated($"UPDATE Payments SET OrganizationId = {defaultOrg.Id} WHERE OrganizationId = 0");
                context.Database.ExecuteSqlInterpolated($"UPDATE UserAccounts SET OrganizationId = {defaultOrg.Id} WHERE OrganizationId = 0");
                context.Database.ExecuteSqlInterpolated($"UPDATE SystemSettings SET OrganizationId = {defaultOrg.Id} WHERE OrganizationId = 0");
                context.Database.ExecuteSqlInterpolated($"UPDATE TenantDocuments SET OrganizationId = {defaultOrg.Id} WHERE OrganizationId = 0");
                context.Database.ExecuteSqlInterpolated($"UPDATE Notifications SET OrganizationId = {defaultOrg.Id} WHERE OrganizationId = 0");
                context.Database.ExecuteSqlInterpolated($"UPDATE AuditLogs SET OrganizationId = {defaultOrg.Id} WHERE OrganizationId = 0");
                context.Database.ExecuteSqlInterpolated($"UPDATE MaintenanceTickets SET OrganizationId = {defaultOrg.Id} WHERE OrganizationId = 0");
            }

            // Ensure SystemSettings exist for the default org
            if (!context.SystemSettings.IgnoreQueryFilters().Any(s => s.OrganizationId == defaultOrg.Id))
            {
                context.SystemSettings.Add(new SystemSetting
                {
                    OrganizationId = defaultOrg.Id,
                    CompanyName = "RentalMgr",
                    CurrencySymbol = "$",
                    DefaultInvoiceDueDays = 7,
                    DefaultElectricityRate = 1000m,
                    DefaultWaterRate = 1500m,
                    ExchangeRateUsdToKhr = 4100m
                });
                context.SaveChanges();
            }

            // Ensure a subscription exists for the default org
            if (!context.Subscriptions.IgnoreQueryFilters().Any(s => s.OrganizationId == defaultOrg.Id))
            {
                context.Subscriptions.Add(new Subscription
                {
                    OrganizationId = defaultOrg.Id,
                    Tier = SubscriptionTier.Pro,
                    Status = SubscriptionStatus.Active,
                    StartDateUtc = DateTime.UtcNow,
                    MonthlyPrice = 49.99m
                });
                context.SaveChanges();
            }

            // Look for any buildings for this specific organization
            if (context.Buildings.Any(b => b.OrganizationId == defaultOrg.Id))
            {
                return;   // DB has been seeded for this org
            }

            // 1. Create Building
            var building = new Building
            {
                OrganizationId = defaultOrg.Id,
                Name = "Skyline Apartments",
                Address = "123 Main St, Phnom Penh",
                WaterUnitPrice = 0.60m,
                ElectricUnitPrice = 0.25m
            };
            context.Buildings.Add(building);
            context.SaveChanges();

            // 2. Create Room Types
            var typeStandard = new RoomType { OrganizationId = defaultOrg.Id, Name = "Standard", BasePrice = 120.00m, Description = "1 Bedroom, 1 Bath" };
            var typeVIP = new RoomType { OrganizationId = defaultOrg.Id, Name = "VIP", BasePrice = 250.00m, Description = "2 Bedroom, AC, Balcony" };
            context.RoomTypes.AddRange(typeStandard, typeVIP);
            context.SaveChanges();

            // 3. Create Rooms
            var rooms = new Room[]
            {
                new Room { OrganizationId = defaultOrg.Id, RoomNumber = "101", Floor = 1, BuildingId = building.Id, RoomTypeId = typeStandard.Id, Status = RoomStatus.Occupied },
                new Room { OrganizationId = defaultOrg.Id, RoomNumber = "102", Floor = 1, BuildingId = building.Id, RoomTypeId = typeStandard.Id, Status = RoomStatus.Vacant },
                new Room { OrganizationId = defaultOrg.Id, RoomNumber = "201", Floor = 2, BuildingId = building.Id, RoomTypeId = typeVIP.Id, Status = RoomStatus.Vacant },
                new Room { OrganizationId = defaultOrg.Id, RoomNumber = "202", Floor = 2, BuildingId = building.Id, RoomTypeId = typeVIP.Id, Status = RoomStatus.Vacant }
            };
            context.Rooms.AddRange(rooms);
            context.SaveChanges();

            // 4. Create Tenant
            var tenant = new Tenant
            {
                OrganizationId = defaultOrg.Id,
                Name = "Sok Dara",
                Phone = "012-345-678",
                NationalId = "123456789",
                Hometown = "Siem Reap"
            };
            context.Tenants.Add(tenant);
            context.SaveChanges();

            // 5. Create Contract (for Room 101)
            var contract = new Contract
            {
                OrganizationId = defaultOrg.Id,
                TenantId = tenant.Id,
                RoomId = rooms[0].Id, // 101
                StartDate = DateTime.Today.AddDays(-15), // Moved in 15 days ago
                EndDate = DateTime.Today.AddMonths(6),
                RentPrice = typeStandard.BasePrice,
                DepositAmount = typeStandard.BasePrice * 1, // 1 month deposit
                Status = ContractStatus.Active
            };
            context.Contracts.Add(contract);
            
            // Add initial meter reading for occupied room
            context.UtilityMeters.AddRange(
                new UtilityMeter { OrganizationId = defaultOrg.Id, RoomId = rooms[0].Id, Type = MeterType.Water, CurrentReading = 100, LastReadingDate = DateTime.Today.AddDays(-30) },
                new UtilityMeter { OrganizationId = defaultOrg.Id, RoomId = rooms[0].Id, Type = MeterType.Electric, CurrentReading = 500, LastReadingDate = DateTime.Today.AddDays(-30) }
            );

            context.SaveChanges();
        }
    }
}
