using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using RentalSystem.Web.Data;
using RentalSystem.Web.Models;

namespace RentalSystem.Web.Pages.Tenancy.Contracts
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
            ViewData["TenantId"] = new SelectList(_context.Tenants, "Id", "Name");
            // Only show vacant rooms ideally, but good to list all for now or filter by Status=Vacant
            var rooms = _context.Rooms
                .Include(r => r.RoomType)
                .Select(r => new { Id = r.Id, Name = $"{r.RoomNumber} ({r.RoomType.Name} - ${r.RoomType.BasePrice})" })
                .ToList();
            
            ViewData["RoomId"] = new SelectList(rooms, "Id", "Name");
            return Page();
        }

        [BindProperty]
        public Contract Contract { get; set; } = default!;

        public async Task<IActionResult> OnPostAsync()
        {
            if (!ModelState.IsValid)
            {
               ViewData["TenantId"] = new SelectList(_context.Tenants, "Id", "Name");
               ViewData["RoomId"] = new SelectList(_context.Rooms, "Id", "RoomNumber");
               return Page();
            }

            // 1. Save Contract
            _context.Contracts.Add(Contract);
            
            // 2. Update Room Status to Occupied
            var room = await _context.Rooms.FindAsync(Contract.RoomId);
            if(room != null)
            {
                room.Status = RoomStatus.Occupied;
            }

            await _context.SaveChangesAsync();

            return RedirectToPage("./Index");
        }
    }
}
