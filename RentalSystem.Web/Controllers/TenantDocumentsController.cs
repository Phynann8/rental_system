using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RentalSystem.Web.Models.Dtos;
using RentalSystem.Web.Security;
using RentalSystem.Web.Services;

namespace RentalSystem.Web.Controllers
{
    [ApiController]
    [Authorize(Policy = AuthorizationPolicies.PropertyManagement)]
    [Route("api/tenants/{tenantId:int}/documents")]
    public sealed class TenantDocumentsController : ControllerBase
    {
        private readonly ITenantDocumentService _documentService;

        public TenantDocumentsController(ITenantDocumentService documentService)
        {
            _documentService = documentService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<TenantDocumentDto>>> GetDocuments(int tenantId)
        {
            return Ok(await _documentService.GetDocumentsAsync(tenantId));
        }

        [HttpPost("upload")]
        [RequestSizeLimit(10 * 1024 * 1024)] // 10MB limit
        public async Task<ActionResult<TenantDocumentDto>> UploadDocument(int tenantId, [FromForm] IFormFile file, [FromForm] string title, [FromForm] string type)
        {
            try
            {
                var doc = await _documentService.UploadDocumentAsync(tenantId, file, title, type);
                return Ok(doc);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpGet("{id:int}/download")]
        public async Task<IActionResult> DownloadDocument(int tenantId, int id)
        {
            var result = await _documentService.DownloadDocumentAsync(tenantId, id);
            if (result == null) return NotFound();

            return File(result.Value.Bytes, result.Value.ContentType, result.Value.FileName);
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteDocument(int tenantId, int id)
        {
            var success = await _documentService.DeleteDocumentAsync(tenantId, id);
            if (!success) return NotFound();

            return NoContent();
        }
    }
}
