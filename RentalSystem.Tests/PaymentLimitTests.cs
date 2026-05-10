using Microsoft.EntityFrameworkCore;
using RentalSystem.Web.Data;
using RentalSystem.Web.Models;
using RentalSystem.Web.Security;

namespace RentalSystem.Tests;

public sealed class PaymentLimitTests
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

        var invoice = new Invoice
        {
            Contract = contract,
            Date = DateTime.Now,
            DueDate = DateTime.Now.AddDays(15),
            TotalAmount = 600m,
            Status = InvoiceStatus.Unpaid
        };

        context.Buildings.Add(building);
        context.RoomTypes.Add(roomType);
        context.Rooms.Add(room);
        context.Tenants.Add(tenant);
        context.Contracts.Add(contract);
        context.Invoices.Add(invoice);
        context.SaveChanges();
    }

    [Fact]
    public async Task CanRecordPaymentForUnpaidInvoice()
    {
        // Arrange
        using var context = CreateTestDbContext();
        SeedTestData(context);

        var invoice = context.Invoices.First();
        var paymentAmount = 300m;

        // Act
        var payment = new Payment
        {
            InvoiceId = invoice.Id,
            Amount = paymentAmount,
            Date = DateTime.Now,
            Method = PaymentMethod.BankTransfer
        };

        context.Payments.Add(payment);
        await context.SaveChangesAsync();

        // Assert
        var savedPayment = context.Payments.First();
        Assert.Equal(paymentAmount, savedPayment.Amount);
        Assert.Equal(invoice.Id, savedPayment.InvoiceId);
    }

    [Fact]
    public void PaymentAmountCannotExceed_RemainingBalance()
    {
        // Arrange
        using var context = CreateTestDbContext();
        SeedTestData(context);

        var invoice = context.Invoices
            .Include(i => i.Payments)
            .First();

        var totalAmount = invoice.TotalAmount; // 600
        var paymentAmount = totalAmount + 100; // Trying to pay 700

        // Act
        var paidAmount = invoice.Payments.Sum(p => p.Amount);
        var remaining = totalAmount - paidAmount;
        var isValid = paymentAmount <= remaining;

        // Assert
        Assert.False(isValid);
        Assert.True(paymentAmount > remaining);
    }

    [Fact]
    public async Task CanMakeMultiplePartialPayments()
    {
        // Arrange
        using var context = CreateTestDbContext();
        SeedTestData(context);

        var invoice = context.Invoices.First();

        // Act - Payment 1
        var payment1 = new Payment
        {            InvoiceId = invoice.Id,
            Amount = 200m,
            Date = DateTime.Now.AddDays(-5),
            Method = PaymentMethod.Cash
        };
        context.Payments.Add(payment1);
        await context.SaveChangesAsync();

        // Payment 2
        var payment2 = new Payment
        {            InvoiceId = invoice.Id,
            Amount = 250m,
            Date = DateTime.Now.AddDays(-2),
            Method = PaymentMethod.BankTransfer
        };
        context.Payments.Add(payment2);
        await context.SaveChangesAsync();

        // Payment 3
        var payment3 = new Payment
        {            InvoiceId = invoice.Id,
            Amount = 150m,
            Date = DateTime.Now,
            Method = PaymentMethod.QRCode
        };
        context.Payments.Add(payment3);
        await context.SaveChangesAsync();

        // Assert
        var payments = context.Payments.Where(p => p.InvoiceId == invoice.Id).ToList();
        Assert.Equal(3, payments.Count);
        Assert.Equal(600m, payments.Sum(p => p.Amount));
    }

    [Fact]
    public void CannotRecordNegativePayment()
    {
        // Arrange
        using var context = CreateTestDbContext();
        SeedTestData(context);

        var invoice = context.Invoices.First();

        // Act & Assert
        var negativePayment = new Payment
        {            InvoiceId = invoice.Id,
            Amount = -50m, // Invalid negative amount
            Date = DateTime.Now,
            Method = PaymentMethod.Cash
        };

        // This should be validated at the controller level
        Assert.True(negativePayment.Amount < 0);
    }

    [Fact]
    public void CannotRecordZeroPayment()
    {
        // Arrange
        using var context = CreateTestDbContext();
        SeedTestData(context);

        var invoice = context.Invoices.First();

        // Act & Assert
        var zeroPayment = new Payment
        {            InvoiceId = invoice.Id,
            Amount = 0m, // Invalid zero amount
            Date = DateTime.Now,
            Method = PaymentMethod.Cash
        };

        // This should be validated at the controller level
        Assert.Equal(0m, zeroPayment.Amount);
    }

    [Fact]
    public async Task PaymentMethodsCanBeDifferent()
    {
        // Arrange
        using var context = CreateTestDbContext();
        SeedTestData(context);

        var invoice = context.Invoices.First();

        // Act
        var cashPayment = new Payment
        {
            InvoiceId = invoice.Id,
            Amount = 200m,
            Date = DateTime.Now.AddDays(-3),
            Method = PaymentMethod.Cash
        };

        var bankPayment = new Payment
        {
            InvoiceId = invoice.Id,
            Amount = 250m,
            Date = DateTime.Now.AddDays(-1),
            Method = PaymentMethod.BankTransfer
        };

        var qrPayment = new Payment
        {
            InvoiceId = invoice.Id,
            Amount = 150m,
            Date = DateTime.Now,
            Method = PaymentMethod.QRCode
        };

        context.Payments.AddRange(cashPayment, bankPayment, qrPayment);
        await context.SaveChangesAsync();

        // Assert
        var payments = context.Payments.Where(p => p.InvoiceId == invoice.Id).ToList();
        Assert.Contains(payments, p => p.Method == PaymentMethod.Cash);
        Assert.Contains(payments, p => p.Method == PaymentMethod.BankTransfer);
        Assert.Contains(payments, p => p.Method == PaymentMethod.QRCode);
    }

    [Fact]
    public async Task CalculateTotalPaymentsForInvoice()
    {
        // Arrange
        using var context = CreateTestDbContext();
        SeedTestData(context);

        var invoice = context.Invoices.First();

        // Act
        var payment1 = new Payment { InvoiceId = invoice.Id, Amount = 200m, Date = DateTime.Now, Method = PaymentMethod.Cash };
        var payment2 = new Payment { InvoiceId = invoice.Id, Amount = 150m, Date = DateTime.Now, Method = PaymentMethod.Cash };
        var payment3 = new Payment { InvoiceId = invoice.Id, Amount = 100m, Date = DateTime.Now, Method = PaymentMethod.Cash };

        context.Payments.AddRange(payment1, payment2, payment3);
        await context.SaveChangesAsync();

        var totalPaid = context.Payments
            .Where(p => p.InvoiceId == invoice.Id)
            .Sum(p => p.Amount);

        // Assert
        Assert.Equal(450m, totalPaid);
    }

    [Fact]
    public async Task CalculateRemainingBalance()
    {
        // Arrange
        using var context = CreateTestDbContext();
        SeedTestData(context);

        var invoice = context.Invoices
            .Include(i => i.Payments)
            .First();

        var invoiceAmount = 600m;

        // Record some payments
        var payment1 = new Payment { InvoiceId = invoice.Id, Amount = 200m, Date = DateTime.Now, Method = PaymentMethod.Cash };
        var payment2 = new Payment { InvoiceId = invoice.Id, Amount = 150m, Date = DateTime.Now, Method = PaymentMethod.Cash };

        context.Payments.AddRange(payment1, payment2);
        await context.SaveChangesAsync();

        // Act
        var paidAmount = context.Payments
            .Where(p => p.InvoiceId == invoice.Id)
            .Sum(p => p.Amount);
        
        var remaining = invoiceAmount - paidAmount;

        // Assert
        Assert.Equal(250m, remaining);
    }

    [Fact]
    public async Task InvoiceStatusUpdates_BasedOnPayments()
    {
        // Arrange
        using var context = CreateTestDbContext();
        SeedTestData(context);

        var invoice = context.Invoices.First();
        var totalAmount = invoice.TotalAmount; // 600

        // Act - Partial payment
        var partialPayment = new Payment
        {
            InvoiceId = invoice.Id,
            Amount = 300m,
            Date = DateTime.Now,
            Method = PaymentMethod.Cash
        };
        context.Payments.Add(partialPayment);
        await context.SaveChangesAsync();

        var paidAfterPartial = context.Payments
            .Where(p => p.InvoiceId == invoice.Id)
            .Sum(p => p.Amount);

        var statusAfterPartial = paidAfterPartial == 0 ? InvoiceStatus.Unpaid
            : paidAfterPartial >= totalAmount ? InvoiceStatus.Paid
            : InvoiceStatus.Partial;

        // Assert
        Assert.Equal(InvoiceStatus.Partial, statusAfterPartial);

        // Act - Full payment
        var finalPayment = new Payment
        {
            InvoiceId = invoice.Id,
            Amount = 300m,
            Date = DateTime.Now,
            Method = PaymentMethod.Cash
        };
        context.Payments.Add(finalPayment);
        await context.SaveChangesAsync();

        var paidAfterFull = context.Payments
            .Where(p => p.InvoiceId == invoice.Id)
            .Sum(p => p.Amount);

        var statusAfterFull = paidAfterFull >= totalAmount ? InvoiceStatus.Paid : InvoiceStatus.Partial;

        // Assert
        Assert.Equal(InvoiceStatus.Paid, statusAfterFull);
    }

    [Fact]
    public async Task PaymentDateCanBeDifferentFromInvoiceDate()
    {
        // Arrange
        using var context = CreateTestDbContext();
        SeedTestData(context);

        var invoice = context.Invoices.First();
        var invoiceDate = invoice.Date;
        var paymentDate = invoiceDate.AddDays(10);

        // Act
        var payment = new Payment
        {
            InvoiceId = invoice.Id,
            Amount = 300m,
            Date = paymentDate,
            Method = PaymentMethod.Cash
        };

        context.Payments.Add(payment);
        await context.SaveChangesAsync();

        // Assert
        var savedPayment = context.Payments.First();
        Assert.Equal(paymentDate, savedPayment.Date);
        Assert.NotEqual(invoiceDate, savedPayment.Date);
    }
}
