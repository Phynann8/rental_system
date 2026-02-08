using RentalSystem.Web.Models;

namespace RentalSystem.Web.Data
{
    public static class DbInitializer
    {
        public static void Initialize(RentalDbContext context)
        {
            // Look for any buildings.
            if (context.Buildings.Any())
            {
                return;   // DB has been seeded
            }

            // 1. Create Building
            var building = new Building
            {
                Name = "Skyline Apartments",
                Address = "123 Main St, Phnom Penh",
                WaterUnitPrice = 0.60m, // 2500 Riel approx
                ElectricUnitPrice = 0.25m // 1000 Riel approx
            };
            context.Buildings.Add(building);
            context.SaveChanges();

            // 2. Create Room Types
            var typeStandard = new RoomType { Name = "Standard", BasePrice = 120.00m, Description = "1 Bedroom, 1 Bath" };
            var typeVIP = new RoomType { Name = "VIP", BasePrice = 250.00m, Description = "2 Bedroom, AC, Balcony" };
            context.RoomTypes.AddRange(typeStandard, typeVIP);
            context.SaveChanges();

            // 3. Create Rooms
            var rooms = new Room[]
            {
                new Room { RoomNumber = "101", Floor = 1, BuildingId = building.Id, RoomTypeId = typeStandard.Id, Status = RoomStatus.Occupied },
                new Room { RoomNumber = "102", Floor = 1, BuildingId = building.Id, RoomTypeId = typeStandard.Id, Status = RoomStatus.Vacant },
                new Room { RoomNumber = "201", Floor = 2, BuildingId = building.Id, RoomTypeId = typeVIP.Id, Status = RoomStatus.Vacant },
                new Room { RoomNumber = "202", Floor = 2, BuildingId = building.Id, RoomTypeId = typeVIP.Id, Status = RoomStatus.Vacant }
            };
            context.Rooms.AddRange(rooms);
            context.SaveChanges();

            // 4. Create Tenant
            var tenant = new Tenant
            {
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
                new UtilityMeter { RoomId = rooms[0].Id, Type = MeterType.Water, CurrentReading = 100, LastReadingDate = DateTime.Today.AddDays(-30) },
                new UtilityMeter { RoomId = rooms[0].Id, Type = MeterType.Electric, CurrentReading = 500, LastReadingDate = DateTime.Today.AddDays(-30) }
            );

            context.SaveChanges();
        }
    }
}
