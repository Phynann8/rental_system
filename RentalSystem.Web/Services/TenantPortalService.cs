using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using RentalSystem.Web.Data;
using RentalSystem.Web.Models;
using RentalSystem.Web.Models.Dtos;

namespace RentalSystem.Web.Services;

public interface ITenantPortalService
{
    Task<TenantDashboardDto?> GetDashboardAsync(ClaimsPrincipal user);
    Task<List<TenantInvoiceDto>?> GetInvoicesAsync(ClaimsPrincipal user);
    Task<(bool Success, string Message)> SubmitPaymentAsync(ClaimsPrincipal user, TenantPaymentRequest request);
}

public class TenantPortalService : ITenantPortalService
{
    private readonly RentalDbContext _context;
    private readonly IWebHostEnvironment _environment;
    private readonly INotificationService _notificationService;

    public TenantPortalService(
        RentalDbContext context,
        IWebHostEnvironment environment,
        INotificationService notificationService)
    {
        _context = context;
        _environment = environment;
        _notificationService = notificationService;
    }

    public async Task<TenantDashboardDto?> GetDashboardAsync(ClaimsPrincipal user)
    {
        var tenantId = await GetTenantIdAsync(user);
        if (!tenantId.HasValue) return null;

        var activeLeases = await _context.Contracts
            .Include(c => c.Room).ThenInclude(r => r!.Building)
            .Where(c => c.TenantId == tenantId.Value && c.Status == ContractStatus.Active)
            .ToListAsync();

        var invoices = await _context.Invoices
            .Include(i => i.Payments)
            .Where(i => i.Contract!.TenantId == tenantId.Value)
            .OrderByDescending(i => i.Date)
            .ToListAsync();

        var unpaidCount = invoices.Count(i => i.Status != InvoiceStatus.Paid);
        var totalBalance = invoices.Sum(i => i.TotalAmount - i.Payments.Where(p => p.IsVerified).Sum(p => p.Amount));

        return new TenantDashboardDto(
            activeLeases.Select(l => new TenantLeaseDto(
                l.Id,
                l.Room?.RoomNumber ?? "N/A",
                l.Room?.Building?.Name ?? "N/A",
                l.RentPrice,
                l.StartDate,
                l.EndDate)).ToList(),
            unpaidCount,
            totalBalance
        );
    }

    public async Task<List<TenantInvoiceDto>?> GetInvoicesAsync(ClaimsPrincipal user)
    {
        var tenantId = await GetTenantIdAsync(user);
        if (!tenantId.HasValue) return null;

        var invoices = await _context.Invoices
            .Include(i => i.Payments)
            .Include(i => i.Contract).ThenInclude(c => c!.Room)
            .Where(i => i.Contract!.TenantId == tenantId.Value)
            .OrderByDescending(i => i.Date)
            .ToListAsync();

        return invoices.Select(i => {
            var paid = i.Payments.Where(p => p.IsVerified).Sum(p => p.Amount);
            return new TenantInvoiceDto(
                i.Id,
                i.InvoiceKey ?? $"INV-{i.Id}",
                i.Date,
                i.DueDate,
                i.TotalAmount,
                paid,
                i.TotalAmount - paid,
                i.Status.ToString()
            );
        }).ToList();
    }

    public async Task<(bool Success, string Message)> SubmitPaymentAsync(ClaimsPrincipal user, TenantPaymentRequest request)
    {
        var tenantId = await GetTenantIdAsync(user);
        if (!tenantId.HasValue) return (false, "Unauthorized");

        var invoice = await _context.Invoices
            .Include(i => i.Contract)
            .FirstOrDefaultAsync(i => i.Id == request.InvoiceId && i.Contract!.TenantId == tenantId.Value);

        if (invoice == null) return (false, "Invoice not found or access denied.");

        string? receiptPath = null;
        if (request.Receipt != null)
        {
            var fileName = $"{Guid.NewGuid()}{Path.GetExtension(request.Receipt.FileName)}";
            var uploads = Path.Combine(_environment.WebRootPath, "uploads", "receipts");
            if (!Directory.Exists(uploads)) Directory.CreateDirectory(uploads);
            
            var filePath = Path.Combine(uploads, fileName);
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await request.Receipt.CopyToAsync(stream);
            }
            receiptPath = $"/uploads/receipts/{fileName}";
        }

        var payment = new Payment
        {
            InvoiceId = request.InvoiceId,
            Amount = request.Amount,
            Date = DateTime.UtcNow,
            Method = PaymentMethod.BankTransfer,
            IsVerified = false,
            ReceiptPath = receiptPath,
            TenantNotes = request.Notes
        };

        _context.Payments.Add(payment);
        await _context.SaveChangesAsync();

        var tenantName = user.FindFirstValue(ClaimTypes.Name) ?? "A tenant";
        await _notificationService.CreateNotificationAsync(
            invoice.Contract!.OrganizationId,
            "Payment Pending Verification",
            $"{tenantName} has submitted a payment of {request.Amount:C} for Invoice #{request.InvoiceId}.",
            NotificationType.Info,
            $"/invoices?id={request.InvoiceId}"
        );

        return (true, "Payment submitted and pending verification.");
    }

    private async Task<int?> GetTenantIdAsync(ClaimsPrincipal user)
    {
        var userIdClaim = user.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdClaim, out var userId)) return null;

        var account = await _context.UserAccounts.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
        return account?.TenantId;
    }
}
