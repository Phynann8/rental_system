using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using RentalSystem.Web.Data;
using RentalSystem.Web.Models;

namespace RentalSystem.Web.Pages.Configuration.RoomTypes
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
        public RoomType RoomType { get; set; } = default!;

        public async Task<IActionResult> OnPostAsync()
        {
            if (!ModelState.IsValid)
            {
                return Page();
            }

            _context.RoomTypes.Add(RoomType);
            await _context.SaveChangesAsync();

            return RedirectToPage("./Index");
        }
    }
}
