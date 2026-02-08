using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.AspNetCore.Mvc.Rendering;
using RentalSystem.Web.Data;
using RentalSystem.Web.Models;

namespace RentalSystem.Web.Pages.Configuration.Rooms
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
            ViewData["BuildingId"] = new SelectList(_context.Buildings, "Id", "Name");
            ViewData["RoomTypeId"] = new SelectList(_context.RoomTypes, "Id", "Name");
            return Page();
        }

        [BindProperty]
        public Room Room { get; set; } = default!;

        public async Task<IActionResult> OnPostAsync()
        {
            if (!ModelState.IsValid)
            {
                ViewData["BuildingId"] = new SelectList(_context.Buildings, "Id", "Name");
                ViewData["RoomTypeId"] = new SelectList(_context.RoomTypes, "Id", "Name");
                return Page();
            }

            _context.Rooms.Add(Room);
            await _context.SaveChangesAsync();

            return RedirectToPage("./Index");
        }
    }
}
