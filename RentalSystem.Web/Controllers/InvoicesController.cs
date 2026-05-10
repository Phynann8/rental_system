using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RentalSystem.Web.Data;
using RentalSystem.Web.Models;
using RentalSystem.Web.Models.Dtos;
using RentalSystem.Web.Security;
using RentalSystem.Web.Services;
using ClosedXML.Excel;

namespace RentalSystem.Web.Controllers;

[ApiController]
[Authorize(Policy = AuthorizationPolicies.BillingOperations)]
[Route("api/invoices")]
public sealed class InvoicesController : ControllerBase
{
    private readonly RentalDbContext _context;
    private readonly IInvoiceService _invoiceService;
    private readonly IPaymentService _paymentService;
    private readonly IInvoicePdfService _pdfService;
    private readonly IExcelExportService _excelService;

    public InvoicesController(
        RentalDbContext context, 
        IInvoiceService invoiceService, 
        IPaymentService paymentService, 
        IInvoicePdfService pdfService,
        IExcelExportService excelService)
    {
        _context = context;
        _invoiceService = invoiceService;
        _paymentService = paymentService;
        _pdfService = pdfService;
        _excelService = excelService;
    }

    [HttpGet]
    public async Task<ActionResult<InvoiceListResponse>> GetInvoices([FromQuery] int? year, [FromQuery] int? month)
    {
        var (periodStart, periodEnd, selectedYear, selectedMonth) = GetPeriodRange(year, month);

        var invoices = await _context.Invoices
            .AsNoTracking()
            .Include(i => i.Payments)
            .Include(i => i.Contract!).ThenInclude(c => c.Tenant)
            .Include(i => i.Contract!).ThenInclude(c => c.Room!).ThenInclude(r => r.Building)
            .Where(i => i.Date >= periodStart && i.Date < periodEnd)
            .OrderByDescending(i => i.DueDate)
            .ToListAsync();

        var payload = invoices
            .Where(i => i.Contract?.Tenant != null && i.Contract.Room?.Building != null)
            .Select(MapInvoice)
            .ToList();

        var buildings = await _context.Buildings
            .AsNoTracking()
            .OrderBy(b => b.Name)
            .Select(b => new LookupDto(b.Id, b.Name))
            .ToListAsync();

        return Ok(new InvoiceListResponse(
            selectedYear,
            selectedMonth,
            CalculateSummary(payload),
            buildings,
            payload));
    }

    [HttpPost("generate")]
    public async Task<ActionResult<GenerateInvoicesResponse>> GenerateInvoices([FromBody] GenerateInvoicesRequest request)
    {
        try
        {
            var billDate = request.InvoiceDate?.Date ?? DateTime.Today;
            var (generated, skipped) = await _invoiceService.BulkGenerateBuildingInvoicesAsync(request.BuildingId, billDate);
            return Ok(new GenerateInvoicesResponse(generated, skipped, billDate, request.BuildingId));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to generate invoices. " + ex.Message });
        }
    }

    [HttpPost("{invoiceId:int}/payments")]
    public async Task<ActionResult<InvoiceDto>> RecordPayment(int invoiceId, [FromBody] RecordPaymentRequest request)
    {
        try
        {
            await _paymentService.RecordPaymentAsync(invoiceId, request.Amount, request.Method);

            var refreshed = await _context.Invoices
                .AsNoTracking()
                .Include(i => i.Payments)
                .Include(i => i.Contract!).ThenInclude(c => c.Tenant)
                .Include(i => i.Contract!).ThenInclude(c => c.Room!).ThenInclude(r => r.Building)
                .FirstAsync(i => i.Id == invoiceId);

            return Ok(MapInvoice(refreshed));
        }
        catch (Exception ex) when (ex is ArgumentException or InvalidOperationException)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (DbUpdateConcurrencyException)
        {
            return Conflict(new { message = "Invoice was modified by another process. Please retry the payment." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to record payment. " + ex.Message });
        }
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<InvoiceDetailDto>> GetInvoice(int id)
    {
        var invoice = await _context.Invoices
            .AsNoTracking()
            .Include(i => i.Items)
            .Include(i => i.Payments)
            .Include(i => i.Contract!).ThenInclude(c => c.Tenant)
            .Include(i => i.Contract!).ThenInclude(c => c.Room!).ThenInclude(r => r.Building)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (invoice == null || invoice.Contract?.Tenant == null || invoice.Contract.Room?.Building == null)
            return NotFound(new { message = "Invoice not found or incomplete data." });

        var paidAmount = invoice.Payments.Sum(p => p.Amount);
        var balance = invoice.TotalAmount - paidAmount;
        var status = DeriveStatus(invoice, balance);

        return Ok(new InvoiceDetailDto(
            invoice.Id,
            invoice.Contract.Tenant.Name,
            invoice.Contract.TenantId.ToString(),
            invoice.Contract.Tenant.Phone ?? "N/A",
            invoice.Contract.Room?.RoomNumber ?? "N/A",
            invoice.Contract.Room?.Building?.Name ?? "N/A",
            invoice.Contract.Room?.Building?.Address ?? "N/A",
            status,
            invoice.Date,
            invoice.DueDate,
            invoice.TotalAmount,
            paidAmount,
            balance,
            invoice.Items.Select(i => new InvoiceItemDto(i.Description, (double)i.Quantity, i.UnitPrice, i.Total)).ToList(),
            invoice.Payments.Select(p => new PaymentDetailDto(p.Id, p.Amount, p.Date, p.Method.ToString(), p.IsVerified, p.ReceiptPath, p.TenantNotes, p.VerificationNotes)).ToList()));
    }

    [HttpGet("export")]
    public async Task<IActionResult> ExportInvoices([FromQuery] int? year, [FromQuery] int? month)
    {
        var (periodStart, periodEnd, selectedYear, selectedMonth) = GetPeriodRange(year, month);

        var invoices = await _context.Invoices
            .AsNoTracking()
            .Include(i => i.Payments)
            .Include(i => i.Contract!).ThenInclude(c => c.Tenant)
            .Include(i => i.Contract!).ThenInclude(c => c.Room!).ThenInclude(r => r.Building)
            .Where(i => i.Date >= periodStart && i.Date < periodEnd)
            .OrderByDescending(i => i.Date)
            .ToListAsync();

        var bytes = _excelService.ExportInvoicesToExcel(invoices, selectedYear, selectedMonth);
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"Invoices_{selectedYear}_{selectedMonth:D2}.xlsx");
    }

    private static (DateTime start, DateTime end, int year, int month) GetPeriodRange(int? year, int? month)
    {
        var now = DateTime.Today;
        var selectedYear = year ?? now.Year;
        var selectedMonth = month ?? now.Month;
        var periodStart = new DateTime(selectedYear, selectedMonth, 1);
        var periodEnd = periodStart.AddMonths(1);
        return (periodStart, periodEnd, selectedYear, selectedMonth);
    }

    [HttpGet("{id:int}/download")]
    public async Task<IActionResult> DownloadInvoice(int id)
    {
        var invoice = await _context.Invoices
            .Include(i => i.Payments).Include(i => i.Items)
            .Include(i => i.Contract!).ThenInclude(c => c.Tenant)
            .Include(i => i.Contract!).ThenInclude(c => c.Room!).ThenInclude(r => r.Building)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (invoice == null) return NotFound();

        var settings = await _context.SystemSettings.FirstOrDefaultAsync(s => s.Id == 1) ?? new SystemSetting();
        var pdf = _pdfService.GenerateInvoicePdf(invoice, settings);
        return File(pdf, "application/pdf", $"Invoice_{invoice.Id}_{invoice.Date:yyyyMMdd}.pdf");
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult> DeleteInvoice(int id)
    {
        var invoice = await _context.Invoices.Include(i => i.Payments).FirstOrDefaultAsync(i => i.Id == id);
        if (invoice == null) return NotFound();
        if (invoice.Payments.Any()) return Conflict(new { message = "Cannot delete invoice with recorded payments." });

        _context.Invoices.Remove(invoice);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("payments/{paymentId:int}/verify")]
    public async Task<IActionResult> VerifyPayment(int paymentId, [FromBody] VerifyPaymentRequest request, CancellationToken cancellationToken)
    {
        var payment = await _context.Payments.Include(p => p.Invoice).FirstOrDefaultAsync(p => p.Id == paymentId, cancellationToken);
        if (payment == null) return NotFound();

        payment.IsVerified = request.Approved;
        payment.VerificationNotes = request.Notes;
        if (request.Approved) await _paymentService.UpdateInvoiceStatusAsync(payment.InvoiceId);

        await _context.SaveChangesAsync(cancellationToken);
        return Ok(new { message = request.Approved ? "Payment verified." : "Payment rejected." });
    }

    private static InvoiceDto MapInvoice(Invoice invoice)
    {
        var paidAmount = invoice.Payments.Where(p => p.IsVerified).Sum(p => p.Amount);
        var balance = invoice.TotalAmount - paidAmount;
        var tenantName = invoice.Contract?.Tenant?.Name ?? string.Empty;
        var initials = string.Concat(tenantName.Split(' ', StringSplitOptions.RemoveEmptyEntries).Take(2).Select(p => p[0])).ToUpperInvariant();

        return new InvoiceDto(
            invoice.Id, invoice.ContractId, tenantName,
            invoice.Contract?.Tenant?.Phone ?? string.Empty,
            invoice.Contract?.Room?.RoomNumber ?? string.Empty,
            invoice.Contract?.Room?.Building?.Name ?? string.Empty,
            DeriveStatus(invoice, balance),
            invoice.Date, invoice.DueDate, invoice.TotalAmount,
            paidAmount, balance, initials,
            invoice.Payments.Any(p => !p.IsVerified));
    }

    private static string DeriveStatus(Invoice invoice, decimal balance)
    {
        if (invoice.Status == InvoiceStatus.Paid) return "Paid";
        if (invoice.Status == InvoiceStatus.Partial) return "Partial";
        return invoice.DueDate.Date < DateTime.Today && balance > 0 ? "Overdue" : "Unpaid";
    }

    private static InvoiceSummaryDto CalculateSummary(List<InvoiceDto> payload)
    {
        return new InvoiceSummaryDto(
            payload.Sum(i => i.TotalAmount),
            payload.Sum(i => i.PaidAmount),
            payload.Where(i => i.Status == "Unpaid").Sum(i => i.Balance),
            payload.Where(i => i.Status == "Overdue").Sum(i => i.Balance),
            payload.Count(i => i.Status == "Unpaid"),
            payload.Count(i => i.Status == "Overdue"));
    }
}
