using System.ComponentModel.DataAnnotations;
using RentalSystem.Web.Models;

namespace RentalSystem.Web.Models.Dtos;

public sealed record VerifyPaymentRequest(bool Approved, string? Notes);

public sealed record InvoiceDto(
    int Id,
    int ContractId,
    string Tenant,
    string Phone,
    string Room,
    string Building,
    /// <summary>
    /// Invoice payment status. Possible values:
    /// - "Paid"
    /// - "Partial"
    /// - "Unpaid"
    /// - "Overdue"
    /// </summary>
    string Status,
    DateTime InvoiceDate,
    DateTime DueDate,
    decimal TotalAmount,
    decimal PaidAmount,
    decimal Balance,
    string Initials,
    bool HasUnverifiedPayments);

public sealed record InvoiceItemDto(string Description, double Quantity, decimal Rate, decimal Amount);

public sealed record InvoiceDetailDto(
    int Id,
    string TenantName,
    string TenantId,
    string Phone,
    string RoomNumber,
    string BuildingName,
    string BuildingAddress,
    string Status,
    DateTime InvoiceDate,
    DateTime DueDate,
    decimal TotalAmount,
    decimal PaidAmount,
    decimal Balance,
    IReadOnlyList<InvoiceItemDto> Items,
    IReadOnlyList<PaymentDetailDto> Payments);

public sealed record PaymentDetailDto(
    int Id,
    decimal Amount,
    DateTime Date,
    string Method,
    bool IsVerified,
    string? ReceiptPath,
    string? TenantNotes,
    string? VerificationNotes);

public sealed record InvoiceListResponse(
    int Year,
    int Month,
    InvoiceSummaryDto Summary,
    IReadOnlyList<LookupDto> Buildings,
    IReadOnlyList<InvoiceDto> Invoices);

public sealed record InvoiceSummaryDto(
    decimal TotalInvoiced,
    decimal Collected,
    decimal Pending,
    decimal Overdue,
    int PendingCount,
    int OverdueCount);

public sealed record GenerateInvoicesResponse(int Generated, int Skipped, DateTime InvoiceDate, int BuildingId);

public sealed class GenerateInvoicesRequest
{
    [Range(1, int.MaxValue)]
    public int BuildingId { get; set; }

    [Range(1, 60)]
    public int DueInDays { get; set; } = 5;

    public DateTime? InvoiceDate { get; set; }
}

public sealed class RecordPaymentRequest
{
    [Range(typeof(decimal), "0.01", "999999")]
    public decimal Amount { get; set; }

    public DateTime? Date { get; set; }

    [Required]
    public PaymentMethod Method { get; set; } = PaymentMethod.Cash;
}
