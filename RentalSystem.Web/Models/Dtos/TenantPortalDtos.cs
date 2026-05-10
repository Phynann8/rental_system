using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace RentalSystem.Web.Models.Dtos;

public sealed record TenantDashboardDto(
    List<TenantLeaseDto> ActiveLeases,
    int UnpaidInvoicesCount,
    decimal TotalBalance
);

public sealed record TenantLeaseDto(
    int Id,
    string RoomNumber,
    string BuildingName,
    decimal RentPrice,
    DateTime StartDate,
    DateTime? EndDate
);

public sealed record TenantInvoiceDto(
    int Id,
    string InvoiceNumber,
    DateTime Date,
    DateTime DueDate,
    decimal TotalAmount,
    decimal PaidAmount,
    decimal Balance,
    string Status
);

public sealed class TenantPaymentRequest
{
    [Required]
    public int InvoiceId { get; set; }

    [Range(0.01, 1000000)]
    public decimal Amount { get; set; }

    public IFormFile? Receipt { get; set; }
    
    public string? Notes { get; set; }
}
