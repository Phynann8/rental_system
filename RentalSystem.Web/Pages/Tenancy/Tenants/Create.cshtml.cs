using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using RentalSystem.Web.Data;
using RentalSystem.Web.Models;

namespace RentalSystem.Web.Pages.Tenancy.Tenants
{
    public class CreateModel : PageModel
    {
        private readonly RentalDbContext _context;

        public CreateModel(RentalDbContext context)
        {
            _context = context;
        }

        public IActionResult OnGet()
        {
            return Page();
        }

        [BindProperty]
        public Tenant Tenant { get; set; } = default!;

        public async Task<IActionResult> OnPostAsync()
        {
            if (!ModelState.IsValid)
            {
                return Page();
            }

            _context.Tenants.Add(Tenant);
            await _context.SaveChangesAsync();

            return RedirectToPage("./Index");
        }
    }
}
