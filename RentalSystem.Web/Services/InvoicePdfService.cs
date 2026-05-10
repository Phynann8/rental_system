using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using RentalSystem.Web.Models;
using System.Globalization;

namespace RentalSystem.Web.Services
{
    public interface IInvoicePdfService
    {
        byte[] GenerateInvoicePdf(Invoice invoice, SystemSetting settings);
    }

    public sealed class InvoicePdfService : IInvoicePdfService
    {
        public InvoicePdfService()
        {
            // Set QuestPDF license (Community for personal/non-commercial use)
            QuestPDF.Settings.License = LicenseType.Community;
        }

        public byte[] GenerateInvoicePdf(Invoice invoice, SystemSetting settings)
        {
            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(1, Unit.Inch);
                    page.PageColor(Colors.White);
                    page.DefaultTextStyle(x => x.FontSize(10).FontFamily("Arial"));

                    page.Header().Row(row =>
                    {
                        row.RelativeItem().Column(col =>
                        {
                            col.Item().Text(settings.CompanyName).FontSize(24).SemiBold().FontColor(Colors.Blue.Medium);
                            col.Item().Text($"{settings.AddressLine1 ?? "Property Management"}").FontSize(10);
                            col.Item().Text($"{settings.AddressLine2 ?? ""}");
                        });

                        row.RelativeItem().AlignRight().Column(col =>
                        {
                            col.Item().Text("INVOICE").FontSize(32).ExtraBold().FontColor(Colors.Grey.Medium);
                            col.Item().Text($"# {invoice.Id}").FontSize(12).SemiBold();
                            col.Item().Text($"Date: {invoice.Date:MMMM dd, yyyy}");
                        });
                    });

                    page.Content().PaddingVertical(25).Column(col =>
                    {
                        // Billing Info
                        col.Item().Row(row =>
                        {
                            row.RelativeItem().Column(c =>
                            {
                                c.Item().Text("BILL TO:").SemiBold().FontColor(Colors.Grey.Medium);
                                c.Item().Text(invoice.Contract?.Tenant?.Name ?? "N/A").Bold().FontSize(14);
                                c.Item().Text($"Phone: {invoice.Contract?.Tenant?.Phone ?? "N/A"}");
                            });

                            row.RelativeItem().AlignRight().Column(c =>
                            {
                                c.Item().Text("PROPERTY:").SemiBold().FontColor(Colors.Grey.Medium);
                                c.Item().Text(invoice.Contract?.Room?.Building?.Name ?? "N/A").Bold();
                                c.Item().Text($"Room: {invoice.Contract?.Room?.RoomNumber ?? "N/A"}");
                                c.Item().Text($"Due Date: {invoice.DueDate:MMMM dd, yyyy}").FontColor(Colors.Red.Medium);
                            });
                        });

                        col.Item().PaddingTop(20).Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.RelativeColumn(3);
                                columns.RelativeColumn();
                                columns.RelativeColumn();
                                columns.RelativeColumn();
                            });

                            table.Header(header =>
                            {
                                header.Cell().Element(CellStyle).Text("Description");
                                header.Cell().Element(CellStyle).AlignRight().Text("Qty");
                                header.Cell().Element(CellStyle).AlignRight().Text("Rate");
                                header.Cell().Element(CellStyle).AlignRight().Text("Total");

                                static IContainer CellStyle(IContainer container)
                                {
                                    return container.DefaultTextStyle(x => x.SemiBold()).PaddingVertical(5).BorderBottom(1).BorderColor(Colors.Black);
                                }
                            });

                            foreach (var item in invoice.Items)
                            {
                                table.Cell().Element(CellStyle).Text(item.Description);
                                table.Cell().Element(CellStyle).AlignRight().Text($"{item.Quantity}");
                                table.Cell().Element(CellStyle).AlignRight().Text($"{settings.CurrencySymbol}{item.UnitPrice}");
                                table.Cell().Element(CellStyle).AlignRight().Text($"{settings.CurrencySymbol}{item.Total}");

                                static IContainer CellStyle(IContainer container)
                                {
                                    return container.BorderBottom(1).BorderColor(Colors.Grey.Lighten2).PaddingVertical(5);
                                }
                            }
                        });

                        col.Item().AlignRight().PaddingTop(15).Column(c =>
                        {
                            c.Item().Text($"Total: {settings.CurrencySymbol}{invoice.TotalAmount:N2}").FontSize(16).Bold();
                            c.Item().Text($"Paid: {settings.CurrencySymbol}{invoice.PaidAmount:N2}");
                            var balance = invoice.TotalAmount - invoice.PaidAmount;
                            c.Item().Text($"Balance Due: {settings.CurrencySymbol}{balance:N2}").FontSize(14).Bold().FontColor(balance > 0 ? Colors.Red.Medium : Colors.Green.Medium);
                        });

                        if (!string.IsNullOrEmpty(settings.PaymentInstructions))
                        {
                            col.Item().PaddingTop(40).Column(c =>
                            {
                                c.Item().Text("Payment Instructions:").SemiBold();
                                c.Item().Text(settings.PaymentInstructions).FontSize(9);
                            });
                        }
                    });

                    page.Footer().AlignCenter().Column(c =>
                    {
                        c.Item().Text(x =>
                        {
                            x.Span("Page ");
                            x.CurrentPageNumber();
                        });
                        c.Item().Text(settings.CompanyName).FontSize(8).FontColor(Colors.Grey.Medium);
                    });
                });
            });

            return document.GeneratePdf();
        }
    }
}
