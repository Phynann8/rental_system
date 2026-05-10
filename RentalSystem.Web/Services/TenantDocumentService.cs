using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using RentalSystem.Web.Data;
using RentalSystem.Web.Models;
using RentalSystem.Web.Models.Dtos;

namespace RentalSystem.Web.Services;

public interface ITenantDocumentService
{
    Task<IEnumerable<TenantDocumentDto>> GetDocumentsAsync(int tenantId);
    Task<TenantDocumentDto> UploadDocumentAsync(int tenantId, IFormFile file, string? title, string? type);
    Task<(byte[] Bytes, string ContentType, string FileName)?> DownloadDocumentAsync(int tenantId, int id);
    Task<bool> DeleteDocumentAsync(int tenantId, int id);
}

public class TenantDocumentService : ITenantDocumentService
{
    private readonly RentalDbContext _context;
    private readonly IWebHostEnvironment _env;
    private readonly INotificationService _notificationService;

    public TenantDocumentService(RentalDbContext context, IWebHostEnvironment env, INotificationService notificationService)
    {
        _context = context;
        _env = env;
        _notificationService = notificationService;
    }

    public async Task<IEnumerable<TenantDocumentDto>> GetDocumentsAsync(int tenantId)
    {
        return await _context.TenantDocuments
            .AsNoTracking()
            .Where(d => d.TenantId == tenantId)
            .OrderByDescending(d => d.UploadedAt)
            .Select(d => new TenantDocumentDto(
                d.Id,
                d.Title,
                d.DocumentType,
                d.ContentType,
                d.FileSize,
                d.UploadedAt))
            .ToListAsync();
    }

    public async Task<TenantDocumentDto> UploadDocumentAsync(int tenantId, IFormFile file, string? title, string? type)
    {
        if (file == null || file.Length == 0)
            throw new ArgumentException("No file uploaded.");

        var tenant = await _context.Tenants.FindAsync(tenantId);
        if (tenant == null)
            throw new KeyNotFoundException("Tenant not found.");

        var uploadPath = Path.Combine(_env.WebRootPath, "uploads", "tenants", tenantId.ToString());
        if (!Directory.Exists(uploadPath))
            Directory.CreateDirectory(uploadPath);

        var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
        var filePath = Path.Combine(uploadPath, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var doc = new TenantDocument
        {
            TenantId = tenantId,
            Title = title ?? file.FileName,
            DocumentType = type ?? "IDScan",
            FilePath = Path.Combine("uploads", "tenants", tenantId.ToString(), fileName),
            ContentType = file.ContentType,
            FileSize = file.Length,
            UploadedAt = DateTime.UtcNow
        };

        _context.TenantDocuments.Add(doc);
        await _context.SaveChangesAsync();

        await _notificationService.CreateNotificationAsync(
            doc.OrganizationId,
            "Document Uploaded",
            $"New document '{doc.Title}' uploaded for tenant",
            NotificationType.Info,
            $"/tenancy?id={doc.TenantId}"
        );

        return new TenantDocumentDto(doc.Id, doc.Title, doc.DocumentType, doc.ContentType, doc.FileSize, doc.UploadedAt);
    }

    public async Task<(byte[] Bytes, string ContentType, string FileName)?> DownloadDocumentAsync(int tenantId, int id)
    {
        var doc = await _context.TenantDocuments.FindAsync(id);
        if (doc == null || doc.TenantId != tenantId)
            return null;

        var filePath = Path.Combine(_env.WebRootPath, doc.FilePath);
        if (!System.IO.File.Exists(filePath))
            return null;

        var bytes = await System.IO.File.ReadAllBytesAsync(filePath);
        return (bytes, doc.ContentType, doc.Title + Path.GetExtension(doc.FilePath));
    }

    public async Task<bool> DeleteDocumentAsync(int tenantId, int id)
    {
        var doc = await _context.TenantDocuments.FindAsync(id);
        if (doc == null || doc.TenantId != tenantId)
            return false;

        var filePath = Path.Combine(_env.WebRootPath, doc.FilePath);
        if (System.IO.File.Exists(filePath))
        {
            System.IO.File.Delete(filePath);
        }

        _context.TenantDocuments.Remove(doc);
        await _context.SaveChangesAsync();
        return true;
    }
}
