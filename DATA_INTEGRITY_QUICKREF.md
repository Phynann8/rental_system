# Data Integrity Reference Card

## Quick Command Reference

### Apply Migration
```bash
cd RentalSystem.Web
dotnet ef database update
```

### Rollback Migration
```bash
dotnet ef database update 20260403074849_AddUserAuth
```

### Generate New Migration (if schema changes)
```bash
dotnet ef migrations add DescriptionOfChange
```

---

## Key Constraints (Cannot Be Bypassed)

| Constraint | Location | Trigger |
|-----------|----------|---------|
| Room number unique per building | `IX_Rooms_BuildingId_RoomNumber_Unique` | `DbUpdateException` if violated |
| Invoice per contract-month | `IX_Invoices_InvoiceKey_Unique` | `DbUpdateException` if violated |
| One meter type per room | `IX_UtilityMeters_RoomId_Type_Unique` | `DbUpdateException` if violated |
| Concurrent modification detected | `RowVersion` on Invoice/Payment | `DbUpdateConcurrencyException` if violated |

---

## Service Usage Examples

### Creating a Lease (Atomic, No Double-Booking)
```csharp
public class LeasesController
{
    [HttpPost]
    public async Task<ActionResult> CreateLease([FromBody] CreateLeaseRequest request)
    {
        try
        {
            var contract = await _contractService.CreateLeaseAsync(
                tenantId: request.TenantId,
                roomId: request.RoomId,
                startDate: request.StartDate,
                endDate: request.EndDate,
                rentPrice: request.RentPrice,
                depositAmount: request.DepositAmount);
            
            return CreatedAtAction(nameof(GetOptions), new { id = contract.Id }, contract);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }
}
```

### Recording a Payment (Prevents Overpayment)
```csharp
try
{
    var payment = await _paymentService.RecordPaymentAsync(
        invoiceId: 42,
        amount: 500.00m,
        method: PaymentMethod.BankTransfer);
    
    // Payment recorded, invoice status auto-updated
    return Ok(payment);
}
catch (InvalidOperationException ex)
{
    // Amount exceeds balance or other validation error
    return BadRequest(new { message = ex.Message });
}
catch (DbUpdateConcurrencyException)
{
    // Invoice was modified by another request
    return Conflict(new { message = "Retry the request" });
}
```

### Generating Invoices (Idempotent)
```csharp
// Safe to call multiple times
var invoice = await _invoiceService.GetOrCreateInvoiceAsync(
    contractId: 42,
    invoiceDate: new DateTime(2026, 4, 1),
    totalAmount: 1500.00m,
    items: new[]
    {
        ("Rent", 1000.00m),
        ("Water", 250.00m),
        ("Electric", 250.00m)
    });

// Second call returns same invoice
var sameInvoice = await _invoiceService.GetOrCreateInvoiceAsync(
    contractId: 42,
    invoiceDate: new DateTime(2026, 4, 1),
    totalAmount: 1500.00m,
    items: new[]
    {
        ("Rent", 1000.00m),
        ("Water", 250.00m),
        ("Electric", 250.00m)
    });

// invoice.Id == sameInvoice.Id ✓
```

---

## Testing Scenarios

### Test 1: Duplicate Invoice Prevention
```bash
# Generate invoices
curl -X POST http://localhost:5000/api/invoices/generate \
  -H "Content-Type: application/json" \
  -d '{
    "buildingId": 1,
    "invoiceDate": "2026-04-01",
    "dueInDays": 5
  }'

# Response: { "generated": 5, "skipped": 0, ... }

# Generate again (same month, same building)
curl -X POST http://localhost:5000/api/invoices/generate \
  -H "Content-Type: application/json" \
  -d '{
    "buildingId": 1,
    "invoiceDate": "2026-04-15",  # Same month
    "dueInDays": 5
  }'

# Response: { "generated": 0, "skipped": 5, ... } ✓ Idempotent!
```

### Test 2: Overpayment Prevention
```bash
# Send payment exceeding balance
curl -X POST http://localhost:5000/api/invoices/42/payments \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 2000.00,
    "method": "Cash"
  }'

# Response: 400 Bad Request
# { "message": "Payment amount 2000.00 exceeds remaining balance ..." }
```

### Test 3: Double-Booking Prevention
```bash
# Create lease for Tenant 1, Room 5
curl -X POST http://localhost:5000/api/leases \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": 1,
    "roomId": 5,
    "startDate": "2026-04-01",
    "endDate": "2027-04-01",
    "rentPrice": 1000.00,
    "depositAmount": 2000.00
  }'

# Response: 201 Created ✓

# Attempt lease for Tenant 2, same Room 5
curl -X POST http://localhost:5000/api/leases \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": 2,
    "roomId": 5,
    "startDate": "2026-04-01",
    "endDate": "2027-04-01",
    "rentPrice": 1000.00,
    "depositAmount": 2000.00
  }'

# Response: 409 Conflict
# { "message": "This room already has an active lease." }
```

### Test 4: Concurrent Modification Detection
```csharp
// Simulated concurrent payment recording
var invoice = await db.Invoices.FindAsync(42);

// Assume another thread modifies it
invoice.Status = InvoiceStatus.Paid;
await db.SaveChangesAsync();  // RowVersion increments

// Our thread tries to record payment with old RowVersion
await paymentService.RecordPaymentAsync(42, 100, PaymentMethod.Cash);
// Throws DbUpdateConcurrencyException
// → Show: "Invoice changed. Please refresh and try again."
```

---

## Performance Index Query Examples

### Available Rooms Query (Uses Index)
```csharp
var vacantRooms = await _context.Rooms
    .Where(r => r.BuildingId == buildingId && r.Status == RoomStatus.Vacant)
    .ToListAsync();
// Uses: IX_Rooms_BuildingId_Status
// Speed: O(log n) instead of O(n) full table scan
```

### Tenant Active Lease Check (Uses Index)
```csharp
var hasActiveLease = await _context.Contracts
    .AnyAsync(c => c.TenantId == tenantId && c.Status == ContractStatus.Active);
// Uses: IX_Contracts_TenantId_Status
// Speed: O(log n) with early exit
```

### Overdue Invoices Report (Uses Index)
```csharp
var overdueInvoices = await _context.Invoices
    .Where(i => i.Status != InvoiceStatus.Paid && i.DueDate < DateTime.Today)
    .ToListAsync();
// Uses: IX_Invoices_Status_DueDate
// Speed: O(log n) seek + O(k) scan for results
```

---

## Monitoring & Alerting

### Watch for These Exceptions

**DbUpdateException** with unique constraint message
```
Violation of UNIQUE KEY constraint 'IX_Rooms_BuildingId_RoomNumber_Unique'
Violation of UNIQUE KEY constraint 'IX_Invoices_InvoiceKey_Unique'
```
→ Application logic error, should not occur if services are used correctly

**DbUpdateConcurrencyException**
```
Database operation expected to affect 1 row(s) but actually affected 0 row(s)
```
→ Normal under high concurrency, implement retry-with-backoff

---

## Troubleshooting

### "Migration not applied"
```bash
# Check current schema version
select * from __EFMigrationsHistory

# If 20260403_AddDataIntegrityConstraints missing:
dotnet ef database update
```

### "Duplicate key value violates unique constraint"
```
Check if application code is:
1. Creating duplicate room numbers in same building
2. Generating same invoice multiple times without using InvoiceService
3. Creating multiple meter types for same room
```

### "Row was updated by another process"
```
Normal behavior under concurrent load.
In API: Return 409 Conflict with retry instruction
In UI: Show "Another user modified this. Refresh and try again."
```

---

## Documentation Links
- Full details: [DATA_INTEGRITY.md](DATA_INTEGRITY.md)
- Transaction service: [Services/TransactionService.cs](RentalSystem.Web/Services/TransactionService.cs)
- Payment service: [Services/PaymentService.cs](RentalSystem.Web/Services/PaymentService.cs)
- Invoice service: [Services/InvoiceService.cs](RentalSystem.Web/Services/InvoiceService.cs)
- Contract service: [Services/ContractService.cs](RentalSystem.Web/Services/ContractService.cs)
