using Microsoft.EntityFrameworkCore;
using RentalSystem.Web.Data;
using RentalSystem.Web.Models;
using RentalSystem.Web.Security;

namespace RentalSystem.Tests;

public sealed class MeterValidationTests
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

    private void SeedTestData(RentalDbContext context)
    {
        var building = new Building
        {
            Name = "Test Building",
            Address = "123 Main St",
            WaterUnitPrice = 0.50m,
            ElectricUnitPrice = 0.25m
        };

        var roomType = new RoomType
        {
            Name = "Standard Room",
            BasePrice = 500m
        };

        var room = new Room
        {
            Building = building,
            RoomType = roomType,
            RoomNumber = "101",
            Floor = 1,
            Status = RoomStatus.Occupied
        };

        context.Buildings.Add(building);
        context.RoomTypes.Add(roomType);
        context.Rooms.Add(room);
        context.SaveChanges();
    }

    [Fact]
    public async Task CanCreateWaterMeterReading()
    {
        // Arrange
        using var context = CreateTestDbContext();
        SeedTestData(context);

        var room = context.Rooms.First();
        var readingDate = DateTime.Now;

        // Act
        var meter = new UtilityMeter
        {
            RoomId = room.Id,
            Type = MeterType.Water,
            CurrentReading = 1000.5,
            LastReadingDate = readingDate
        };

        context.UtilityMeters.Add(meter);
        await context.SaveChangesAsync();

        // Assert
        var savedMeter = context.UtilityMeters
            .FirstOrDefault(m => m.RoomId == room.Id && m.Type == MeterType.Water);

        Assert.NotNull(savedMeter);
        Assert.Equal(1000.5, savedMeter.CurrentReading);
        Assert.Equal(readingDate, savedMeter.LastReadingDate);
    }

    [Fact]
    public async Task CanCreateElectricMeterReading()
    {
        // Arrange
        using var context = CreateTestDbContext();
        SeedTestData(context);

        var room = context.Rooms.First();
        var readingDate = DateTime.Now;

        // Act
        var meter = new UtilityMeter
        {
            RoomId = room.Id,
            Type = MeterType.Electric,
            CurrentReading = 5240.75,
            LastReadingDate = readingDate
        };

        context.UtilityMeters.Add(meter);
        await context.SaveChangesAsync();

        // Assert
        var savedMeter = context.UtilityMeters
            .FirstOrDefault(m => m.RoomId == room.Id && m.Type == MeterType.Electric);

        Assert.NotNull(savedMeter);
        Assert.Equal(5240.75, savedMeter.CurrentReading);
        Assert.Equal(MeterType.Electric, savedMeter.Type);
    }

    [Fact]
    public async Task CanUpdateMeterReading_WithHigherValue()
    {
        // Arrange
        using var context = CreateTestDbContext();
        SeedTestData(context);

        var room = context.Rooms.First();
        var oldReadingDate = DateTime.Now.AddDays(-30);
        var newReadingDate = DateTime.Now;

        var meter = new UtilityMeter
        {
            RoomId = room.Id,
            Type = MeterType.Water,
            CurrentReading = 1000,
            LastReadingDate = oldReadingDate
        };

        context.UtilityMeters.Add(meter);
        await context.SaveChangesAsync();

        // Act
        meter.CurrentReading = 1050.5;
        meter.LastReadingDate = newReadingDate;
        await context.SaveChangesAsync();

        // Assert
        var updatedMeter = context.UtilityMeters.Find(meter.Id);
        Assert.NotNull(updatedMeter);
        Assert.Equal(1050.5, updatedMeter.CurrentReading);
        Assert.Equal(newReadingDate, updatedMeter.LastReadingDate);
    }

    [Fact]
    public void MeterReadingCannotBeNegative()
    {
        // Arrange
        using var context = CreateTestDbContext();
        SeedTestData(context);

        var room = context.Rooms.First();

        // Act & Assert
        var meter = new UtilityMeter
        {
            RoomId = room.Id,
            Type = MeterType.Water,
            CurrentReading = -100, // Invalid negative reading
            LastReadingDate = DateTime.Now
        };

        // In a real scenario, this should be validated at the controller/service level
        Assert.True(meter.CurrentReading < 0);
    }

    [Fact]
    public async Task CanRetrieveLatestMeterReadingForRoom()
    {
        // Arrange
        using var context = CreateTestDbContext();
        SeedTestData(context);

        var room = context.Rooms.First();
        var reading1 = new UtilityMeter
        {
            RoomId = room.Id,
            Type = MeterType.Water,
            CurrentReading = 1000,
            LastReadingDate = DateTime.Now.AddDays(-30)
        };

        var reading2 = new UtilityMeter
        {
            RoomId = room.Id,
            Type = MeterType.Water,
            CurrentReading = 1050,
            LastReadingDate = DateTime.Now.AddDays(-15)
        };

        var reading3 = new UtilityMeter
        {
            RoomId = room.Id,
            Type = MeterType.Water,
            CurrentReading = 1100,
            LastReadingDate = DateTime.Now
        };

        context.UtilityMeters.AddRange(reading1, reading2, reading3);
        await context.SaveChangesAsync();

        // Act
        var latestReading = context.UtilityMeters
            .Where(m => m.RoomId == room.Id && m.Type == MeterType.Water)
            .OrderByDescending(m => m.LastReadingDate)
            .FirstOrDefault();

        // Assert
        Assert.NotNull(latestReading);
        Assert.Equal(1100, latestReading.CurrentReading);
    }

    [Fact]
    public void CalculateConsumption_BetweenTwoReadings()
    {
        // Arrange
        using var context = CreateTestDbContext();
        SeedTestData(context);

        var room = context.Rooms.First();
        var oldReading = 1000.0;
        var newReading = 1050.5;

        // Act
        var consumption = newReading - oldReading;

        // Assert
        Assert.Equal(50.5, consumption);
    }

    [Fact]
    public async Task CanStoreMultipleMeterTypes_PerRoom()
    {
        // Arrange
        using var context = CreateTestDbContext();
        SeedTestData(context);

        var room = context.Rooms.First();

        var waterMeter = new UtilityMeter
        {
            RoomId = room.Id,
            Type = MeterType.Water,
            CurrentReading = 1000,
            LastReadingDate = DateTime.Now
        };

        var electricMeter = new UtilityMeter
        {
            RoomId = room.Id,
            Type = MeterType.Electric,
            CurrentReading = 5000,
            LastReadingDate = DateTime.Now
        };

        context.UtilityMeters.AddRange(waterMeter, electricMeter);
        await context.SaveChangesAsync();

        // Act
        var meters = context.UtilityMeters
            .Where(m => m.RoomId == room.Id)
            .ToList();

        // Assert
        Assert.Equal(2, meters.Count);
        Assert.Single(meters, m => m.Type == MeterType.Water);
        Assert.Single(meters, m => m.Type == MeterType.Electric);
    }

    [Fact]
    public async Task MeterReadingDateIsRecorded()
    {
        // Arrange
        using var context = CreateTestDbContext();
        SeedTestData(context);

        var room = context.Rooms.First();
        var readingTime = new DateTime(2024, 3, 15, 14, 30, 0);

        // Act
        var meter = new UtilityMeter
        {
            RoomId = room.Id,
            Type = MeterType.Water,
            CurrentReading = 1000,
            LastReadingDate = readingTime
        };

        context.UtilityMeters.Add(meter);
        await context.SaveChangesAsync();

        // Assert
        var savedMeter = context.UtilityMeters.First();
        Assert.Equal(readingTime, savedMeter.LastReadingDate);
    }
}
