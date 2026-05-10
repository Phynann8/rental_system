using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using ClosedXML.Excel;
using RentalSystem.Web.Models;

namespace RentalSystem.Web.Services;

public interface IExcelExportService
{
    byte[] ExportInvoicesToExcel(IEnumerable<Invoice> invoices, int year, int month);
}

public class ExcelExportService : IExcelExportService
{
    public byte[] ExportInvoicesToExcel(IEnumerable<Invoice> invoices, int year, int month)
    {
        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Invoice Summary");
        
        var headers = new[] { "Invoice ID", "Date", "Tenant", "Building", "Room", "Total Amount", "Paid Amount", "Balance", "Status" };
        ConfigureHeaderRow(worksheet, headers);

        int row = 2;
        foreach (var inv in invoices)
        {
            var paid = inv.Payments.Sum(p => p.Amount);
            var balance = inv.TotalAmount - paid;
            
            worksheet.Cell(row, 1).Value = inv.Id;
            worksheet.Cell(row, 2).Value = inv.Date;
            worksheet.Cell(row, 3).Value = inv.Contract?.Tenant?.Name ?? "N/A";
            worksheet.Cell(row, 4).Value = inv.Contract?.Room?.Building?.Name ?? "N/A";
            worksheet.Cell(row, 5).Value = inv.Contract?.Room?.RoomNumber ?? "N/A";
            worksheet.Cell(row, 6).Value = inv.TotalAmount;
            worksheet.Cell(row, 7).Value = paid;
            worksheet.Cell(row, 8).Value = balance;
            worksheet.Cell(row, 9).Value = DeriveStatusString(inv, balance);
            row++;
        }

        worksheet.Columns().AdjustToContents();
        
        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    private static void ConfigureHeaderRow(IXLWorksheet worksheet, string[] headers)
    {
        for (int i = 0; i < headers.Length; i++)
        {
            worksheet.Cell(1, i + 1).Value = headers[i];
        }
        
        var headerRange = worksheet.Range(1, 1, 1, headers.Length);
        headerRange.Style.Font.Bold = true;
        headerRange.Style.Fill.BackgroundColor = XLColor.LightGray;
    }

    private static string DeriveStatusString(Invoice invoice, decimal balance)
    {
        if (invoice.Status == InvoiceStatus.Paid) return "Paid";
        if (invoice.Status == InvoiceStatus.Partial) return "Partial";
        return invoice.DueDate.Date < DateTime.Today && balance > 0 ? "Overdue" : "Unpaid";
    }
}
