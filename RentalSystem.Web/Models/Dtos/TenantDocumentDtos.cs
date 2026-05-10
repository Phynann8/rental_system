using System;

namespace RentalSystem.Web.Models.Dtos;

public sealed record TenantDocumentDto(
    int Id, 
    string Title, 
    string Type, 
    string ContentType, 
    long Size, 
    DateTime UploadedAt);
