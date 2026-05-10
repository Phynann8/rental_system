using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RentalSystem.Web.Data;
using RentalSystem.Web.Models;

namespace RentalSystem.Web.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class SettingsController : ControllerBase
    {
        private readonly RentalDbContext _context;

        public SettingsController(RentalDbContext context)
        {
            _context = context;
        }

        public class SettingsDto
        {
            public string CompanyName { get; set; } = string.Empty;
            public string CurrencySymbol { get; set; } = string.Empty;
            public int DefaultInvoiceDueDays { get; set; }
            public decimal DefaultElectricityRate { get; set; }
            public decimal DefaultWaterRate { get; set; }
            public decimal ExchangeRateUsdToKhr { get; set; }
        }

        // GET: api/settings
        [HttpGet]
        public async Task<ActionResult<SettingsDto>> GetSettings()
        {
            var settings = await _context.SystemSettings.FirstOrDefaultAsync(s => s.Id == 1);
            
            if (settings == null)
            {
                // Fallback in case seed is missing
                settings = new SystemSetting();
                _context.SystemSettings.Add(settings);
                await _context.SaveChangesAsync();
            }

            return Ok(new SettingsDto
            {
                CompanyName = settings.CompanyName,
                CurrencySymbol = settings.CurrencySymbol,
                DefaultInvoiceDueDays = settings.DefaultInvoiceDueDays,
                DefaultElectricityRate = settings.DefaultElectricityRate,
                DefaultWaterRate = settings.DefaultWaterRate,
                ExchangeRateUsdToKhr = settings.ExchangeRateUsdToKhr
            });
        }

        // PUT: api/settings
        [HttpPut]
        public async Task<ActionResult<SettingsDto>> UpdateSettings([FromBody] SettingsDto dto)
        {
            if (dto.DefaultElectricityRate < 0 || dto.DefaultWaterRate < 0 || dto.ExchangeRateUsdToKhr <= 0)
            {
                return BadRequest("Rates must be greater than zero.");
            }

            var settings = await _context.SystemSettings.FirstOrDefaultAsync(s => s.Id == 1);
            if (settings == null)
            {
                settings = new SystemSetting { Id = 1 };
                _context.SystemSettings.Add(settings);
            }

            // Update Fields
            settings.CompanyName = string.IsNullOrWhiteSpace(dto.CompanyName) ? "RentalMgr" : dto.CompanyName;
            settings.CurrencySymbol = string.IsNullOrWhiteSpace(dto.CurrencySymbol) ? "$" : dto.CurrencySymbol;
            settings.DefaultInvoiceDueDays = dto.DefaultInvoiceDueDays > 0 ? dto.DefaultInvoiceDueDays : 7;
            settings.DefaultElectricityRate = dto.DefaultElectricityRate;
            settings.DefaultWaterRate = dto.DefaultWaterRate;
            settings.ExchangeRateUsdToKhr = dto.ExchangeRateUsdToKhr;

            await _context.SaveChangesAsync();

            return Ok(dto);
        }
    }
}
