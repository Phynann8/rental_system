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
            PopulateSelectLists();
            return Page();
        }

        [BindProperty]
        public Contract Contract { get; set; } = default!;

        public async Task<IActionResult> OnPostAsync()
        {
            if (!ModelState.IsValid)
            {
                PopulateSelectLists();
                return Page();
            }

            // Check for nulls
            var room = await _context.Rooms.FindAsync(Contract.RoomId);
            var tenant = await _context.Tenants.FindAsync(Contract.TenantId);
            if (room == null || tenant == null)
            {
                ModelState.AddModelError(string.Empty, "Invalid Room or Tenant.");
                PopulateSelectLists();
                return Page();
            }

            // 1. Save Contract
            Contract.Room = room;
            Contract.Tenant = tenant;
            Contract.Status = ContractStatus.Active;
            _context.Contracts.Add(Contract);

            // 2. Update Room Status to Occupied
            room.Status = RoomStatus.Occupied;

            await _context.SaveChangesAsync();

            return RedirectToPage("./Index");
        }

        private void PopulateSelectLists()
        {
            ViewData["TenantId"] = new SelectList(_context.Tenants.AsNoTracking(), "Id", "Name");

            var rooms = _context.Rooms
                .AsNoTracking()
                .Include(r => r.RoomType)
                .Select(r => new
                {
                    Id = r.Id,
                    Name = $"{r.RoomNumber} ({(r.RoomType != null ? r.RoomType.Name : "Unassigned Type")} - ${(r.RoomType != null ? r.RoomType.BasePrice : 0m)})"
                })
                .ToList();

            ViewData["RoomId"] = new SelectList(rooms, "Id", "Name");
        }
    }
}
