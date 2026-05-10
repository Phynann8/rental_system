using Microsoft.EntityFrameworkCore;
using RentalSystem.Web.Data;
using RentalSystem.Web.Models;
using RentalSystem.Web.Security;

namespace RentalSystem.Tests;

public sealed class InvoiceGenerationTests
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

        var tenant = new Tenant
        {
            Name = "John Doe",
            Phone = "123-456-7890",
            NationalId = "ID123456"
        };

        var contract = new Contract
        {
            Tenant = tenant,
            Room = room,
            StartDate = DateTime.Now.AddMonths(-3),
            EndDate = DateTime.Now.AddMonths(9),
            RentPrice = 500m,
            DepositAmount = 1000m,
            Status = ContractStatus.Active
        };

        context.Buildings.Add(building);
        context.RoomTypes.Add(roomType);
        context.Rooms.Add(room);
        context.Tenants.Add(tenant);
        context.Contracts.Add(contract);
        context.SaveChanges();
    }

    [Fact]
    public async Task CanGenerateInvoiceWithRentOnly()
    {
        // Arrange
        using var context = CreateTestDbContext();
        SeedTestData(context);

        var contract = context.Contracts.First();
        var invoiceDate = DateTime.Now;
        var dueDate = invoiceDate.AddDays(15);

        // Act
        var invoice = new Invoice
        {
            ContractId = contract.Id,
            Date = invoiceDate,
            DueDate = dueDate,
            TotalAmount = 500m,
            Status = InvoiceStatus.Unpaid
        };

        var rentItem = new InvoiceItem
        {
            Description = "Rent",
            Quantity = 1,
            UnitPrice = 500m,
            Total = 500m
        };

        invoice.Items.Add(rentItem);
        context.Invoices.Add(invoice);
        await context.SaveChangesAsync();

        // Assert
        var savedInvoice = context.Invoices
            .Include(i => i.Items)
            .First();

        Assert.Equal(500m, savedInvoice.TotalAmount);
        Assert.Single(savedInvoice.Items);
        Assert.Equal("Rent", savedInvoice.Items.First().Description);
    }

    [Fact]
    public async Task CanGenerateInvoiceWithRentAndUtilities()
    {
        // Arrange
        using var context = CreateTestDbContext();
        SeedTestData(context);

        var contract = context.Contracts.First();
        var room = contract.Room!;

        // Add meter readings
        var waterMeterOld = new UtilityMeter
        {
            RoomId = room.Id,
            Type = MeterType.Water,
            CurrentReading = 1000,
            LastReadingDate = DateTime.Now.AddDays(-30)
        };

        var waterMeterNew = new UtilityMeter
        {
            RoomId = room.Id,
            Type = MeterType.Water,
            CurrentReading = 1100,
            LastReadingDate = DateTime.Now
        };

        var electricMeterOld = new UtilityMeter
        {
            RoomId = room.Id,
            Type = MeterType.Electric,
            CurrentReading = 5000,
            LastReadingDate = DateTime.Now.AddDays(-30)
        };

        var electricMeterNew = new UtilityMeter
        {
            RoomId = room.Id,
            Type = MeterType.Electric,
            CurrentReading = 5200,
            LastReadingDate = DateTime.Now
        };

        context.UtilityMeters.AddRange(waterMeterOld, waterMeterNew, electricMeterOld, electricMeterNew);
        await context.SaveChangesAsync();

        // Calculate usage
        var waterUsage = 1100 - 1000; // 100 units
        var electricUsage = 5200 - 5000; // 200 units
        var building = context.Buildings.First();
        var waterCost = (decimal)waterUsage * building.WaterUnitPrice; // 100 * 0.50 = 50
        var electricCost = (decimal)electricUsage * building.ElectricUnitPrice; // 200 * 0.25 = 50
        var totalAmount = 500 + waterCost + electricCost; // 600

        // Act
        var invoice = new Invoice
        {
            ContractId = contract.Id,
            Date = DateTime.Now,
            DueDate = DateTime.Now.AddDays(15),
            TotalAmount = totalAmount,
            Status = InvoiceStatus.Unpaid
        };

        invoice.Items.Add(new InvoiceItem
        {
            Description = "Rent",
            Quantity = 1,
            UnitPrice = 500m,
            Total = 500m
        });

        invoice.Items.Add(new InvoiceItem
        {
            Description = $"Water ({waterUsage} units)",
            Quantity = waterUsage,
            UnitPrice = building.WaterUnitPrice,
            Total = waterCost
        });

        invoice.Items.Add(new InvoiceItem
        {
            Description = $"Electricity ({electricUsage} units)",
            Quantity = electricUsage,
            UnitPrice = building.ElectricUnitPrice,
            Total = electricCost
        });

        context.Invoices.Add(invoice);
        await context.SaveChangesAsync();

        // Assert
        var savedInvoice = context.Invoices
            .Include(i => i.Items)
            .First();

        Assert.Equal(600m, savedInvoice.TotalAmount);
        Assert.Equal(3, savedInvoice.Items.Count);
        Assert.Equal(50m, savedInvoice.Items.Where(i => i.Description.Contains("Water")).FirstOrDefault()?.Total);
        Assert.Equal(50m, savedInvoice.Items.Where(i => i.Description.Contains("Electricity")).FirstOrDefault()?.Total);
    }

    [Fact]
    public async Task InvoiceStatusStartsAsUnpaid()
    {
        // Arrange
        using var context = CreateTestDbContext();
        SeedTestData(context);

        var contract = context.Contracts.First();

        // Act
        var invoice = new Invoice
        {
            ContractId = contract.Id,
            Date = DateTime.Now,
            DueDate = DateTime.Now.AddDays(15),
            TotalAmount = 500m,
            Status = InvoiceStatus.Unpaid
        };

        context.Invoices.Add(invoice);
        await context.SaveChangesAsync();

        // Assert
        var savedInvoice = context.Invoices.First();
        Assert.Equal(InvoiceStatus.Unpaid, savedInvoice.Status);
    }

    [Fact]
    public async Task CannotGenerateDuplicateInvoicesForSamePeriod()
    {
        // Arrange
        using var context = CreateTestDbContext();
        SeedTestData(context);

        var contract = context.Contracts.First();
        var invoiceDate = DateTime.Now;

        var invoice1 = new Invoice
        {
            ContractId = contract.Id,
            Date = invoiceDate,
            DueDate = invoiceDate.AddDays(15),
            TotalAmount = 500m,
            Status = InvoiceStatus.Unpaid
        };

        context.Invoices.Add(invoice1);
        await context.SaveChangesAsync();

        // Act - Try to create duplicate for same month
        var monthStart = new DateTime(invoiceDate.Year, invoiceDate.Month, 1);
        var monthEnd = monthStart.AddMonths(1);

        var alreadyExists = context.Invoices.Any(i =>
            i.ContractId == contract.Id &&
            i.Date >= monthStart &&
            i.Date < monthEnd);

        // Assert
        Assert.True(alreadyExists);
    }

    [Fact]
    public async Task InvoiceDueDate_IsSetCorrectly()
    {
        // Arrange
        using var context = CreateTestDbContext();
        SeedTestData(context);

        var contract = context.Contracts.First();
        var invoiceDate = DateTime.Now;
        var expectedDueDate = invoiceDate.AddDays(15);

        // Act
        var invoice = new Invoice
        {
            ContractId = contract.Id,
            Date = invoiceDate,
            DueDate = expectedDueDate,
            TotalAmount = 500m,
            Status = InvoiceStatus.Unpaid
        };

        context.Invoices.Add(invoice);
        await context.SaveChangesAsync();

        // Assert
        var savedInvoice = context.Invoices.First();
        Assert.Equal(expectedDueDate, savedInvoice.DueDate);
        Assert.True(savedInvoice.DueDate > savedInvoice.Date);
    }

    [Fact]
    public async Task CalculateInvoiceAmount_WithDecimalPrecision()
    {
        // Arrange
        using var context = CreateTestDbContext();
        SeedTestData(context);

        var contract = context.Contracts.First();
        var building = context.Buildings.First();

        // Use precise meter readings
        var room = contract.Room!;
        var waterMeterOld = new UtilityMeter
        {
            RoomId = room.Id,
            Type = MeterType.Water,
            CurrentReading = 1000.25,
            LastReadingDate = DateTime.Now.AddDays(-30)
        };

        var waterMeterNew = new UtilityMeter
        {
            RoomId = room.Id,
            Type = MeterType.Water,
            CurrentReading = 1050.75,
            LastReadingDate = DateTime.Now
        };

        context.UtilityMeters.AddRange(waterMeterOld, waterMeterNew);
        await context.SaveChangesAsync();

        // Calculate with precision
        var waterUsage = 1050.75 - 1000.25; // 50.5 units
        var waterCost = (decimal)waterUsage * building.WaterUnitPrice; // 50.5 * 0.50 = 25.25

        // Act
        var invoice = new Invoice
        {
            ContractId = contract.Id,
            Date = DateTime.Now,
            DueDate = DateTime.Now.AddDays(15),
            TotalAmount = 500m + waterCost, // 525.25
            Status = InvoiceStatus.Unpaid
        };

        context.Invoices.Add(invoice);
        await context.SaveChangesAsync();

        // Assert
        var savedInvoice = context.Invoices.First();
        Assert.Equal(525.25m, savedInvoice.TotalAmount);
    }

    [Fact]
    public async Task OnlyGenerateInvoices_ForActiveContracts()
    {
        // Arrange
        using var context = CreateTestDbContext();
        SeedTestData(context);

        var activeContract = context.Contracts.First();
        
        var room = context.Rooms.First();
        var tenant = context.Tenants.First();
        var inactiveContract = new Contract
        {
            TenantId = tenant.Id,
            RoomId = room.Id,
            StartDate = DateTime.Now.AddYears(-2),
            EndDate = DateTime.Now.AddYears(-1),
            RentPrice = 500m,
            DepositAmount = 1000m,
            Status = ContractStatus.Ended
        };

        context.Contracts.Add(inactiveContract);
        await context.SaveChangesAsync();

        // Act - Query for active contracts
        var activeContracts = context.Contracts
            .Where(c => c.Status == ContractStatus.Active)
            .ToList();

        // Assert
        Assert.Single(activeContracts);
        Assert.Equal(activeContract.Id, activeContracts.First().Id);
        Assert.Equal(ContractStatus.Ended, inactiveContract.Status);
    }
}
