# Data Integrity Hardening - Implementation Guide

## Overview

This document describes the database and transaction-level hardening applied to the RentalSystem to ensure data consistency, prevent race conditions, and enforce business rules at the database level.

## What Was Changed

### 1. Database-Level Constraints & Unique Indexes

#### Unique Room Number Per Building
**File:** [RentalDbContext.cs](RentalSystem.Web/Data/RentalDbContext.cs#L87-L91)
**Migration:** `20260403_AddDataIntegrityConstraints.cs`

```csharp
modelBuilder.Entity<Room>()
    .HasIndex(r => new { r.BuildingId, r.RoomNumber })
    .IsUnique()
    .HasDatabaseName("IX_Rooms_BuildingId_RoomNumber_Unique");
```

**Impact:** Prevents duplicate room identifiers within the same building. Example:
- ✅ Building A can have Room 101
- ✅ Building B can have Room 101
- ❌ Building A cannot have two Room 101s (database constraint violation)

**Use Case:** Prevents user confusion and ensures room references are unambiguous within a building context.

---

#### Invoice Idempotency Key
**File:** [RentalDbContext.cs](RentalSystem.Web/Data/RentalDbContext.cs#L120-L126), [Invoice.cs](RentalSystem.Web/Models/Invoice.cs#L25-L30)
**Migration:** `20260403_AddDataIntegrityConstraints.cs`

```csharp
// Model
public string? InvoiceKey { get; set; } // Format: "{ContractId}_{YYYYMM}"

// Constraint
modelBuilder.Entity<Invoice>()
    .HasIndex(i => i.InvoiceKey)
    .IsUnique()
    .HasDatabaseName("IX_Invoices_InvoiceKey_Unique");
```

**Impact:** Prevents duplicate invoice generation for the same contract in the same month.

**Scenario:** If invoice generation runs concurrently:
1. **Thread 1** checks for April 2026 invoice for Contract 42 → not found
2. **Thread 2** checks for April 2026 invoice for Contract 42 → not found
3. **Thread 1** creates invoice with key "42_202604"
4. **Thread 2** attempts to create invoice with same key → **database constraint violation** (idempotent!)

**Benefit:** Safe to retry invoice generation without creating duplicates.

---

#### One Meter Type Per Room
**File:** [RentalDbContext.cs](RentalSystem.Web/Data/RentalDbContext.cs#L190-L196)
**Migration:** `20260403_AddDataIntegrityConstraints.cs`

```csharp
modelBuilder.Entity<UtilityMeter>()
    .HasIndex(m => new { m.RoomId, m.Type })
    .IsUnique()
    .HasDatabaseName("IX_UtilityMeters_RoomId_Type_Unique");
```

**Impact:** Ensures a room has exactly one meter of each type.
- ✅ 1 Water meter per room
- ✅ 1 Electric meter per room
- ✅ 1 Gas meter per room
- ❌ 2 Water meters in same room (database constraint violation)

---

### 2. Concurrency Control with RowVersion

#### What is RowVersion?
A database timestamp column that automatically increments whenever a row is modified. Used for optimistic locking to detect concurrent modifications.

```csharp
[Timestamp]
public byte[]? RowVersion { get; set; }
```

#### Applied to Entities
- **Invoice** – Prevents lost updates when multiple payments are recorded
- **Payment** – Prevents concurrent payment modifications

#### How It Works

**Scenario: Concurrent payment processing**

```
Client A: Fetches Invoice (RowVersion = 0x00000000000000B5)
Client B: Fetches Invoice (RowVersion = 0x00000000000000B5)

Client A: Records $100 payment, RowVersion still 0x00000000000000B5
         → SaveChanges() ✓, RowVersion becomes 0x00000000000000B6

Client B: Records $50 payment, WHERE RowVersion = 0x00000000000000B5
         → 0 rows matched (current RowVersion is B6)
         → DbUpdateConcurrencyException thrown
         → Client B knows concurrent modification occurred
         → Can retry or show "Please refresh and try again"
```

**Files:**
- [Invoice.cs](RentalSystem.Web/Models/Invoice.cs#L32-L37)
- [Payment.cs](RentalSystem.Web/Models/Payment.cs#L26-L31)
- [PaymentService.cs](RentalSystem.Web/Services/PaymentService.cs#L80-L83)

---

### 3. Performance Indexes for Business Logic Queries

All indexes enable efficient enforcement of business rules:

| Index | Location | Purpose |
|-------|----------|---------|
| `IX_Contracts_TenantId_Status` | [RentalDbContext.cs#L101-L104](RentalSystem.Web/Data/RentalDbContext.cs#L101-L104) | Fast check: "Does tenant have active lease?" |
| `IX_Contracts_RoomId_Status` | [RentalDbContext.cs#L107-L110](RentalSystem.Web/Data/RentalDbContext.cs#L107-L110) | Fast check: "Is room already occupied?" |
| `IX_Contracts_DateRanges` | [RentalDbContext.cs#L113-L116](RentalSystem.Web/Data/RentalDbContext.cs#L113-L116) | Fast overlap checks for date ranges |
| `IX_Invoices_ContractId_Date` | [RentalDbContext.cs#L129-L132](RentalSystem.Web/Data/RentalDbContext.cs#L129-L132) | Fast idempotency check for invoice generation |
| `IX_Invoices_Status_DueDate` | [RentalDbContext.cs#L135-L138](RentalSystem.Web/Data/RentalDbContext.cs#L135-L138) | Fast overdue/unpaid invoice reports |
| `IX_Payments_InvoiceId_Date` | [RentalDbContext.cs#L150-L153](RentalSystem.Web/Data/RentalDbContext.cs#L150-L153) | Fast payment history aggregation |
| `IX_Rooms_BuildingId_Status` | [RentalDbContext.cs#L161-L164](RentalSystem.Web/Data/RentalDbContext.cs#L161-L164) | Fast "available rooms" queries |
| `IX_UtilityMeters_LastReadingDate` | [RentalDbContext.cs#L167-L170](RentalSystem.Web/Data/RentalDbContext.cs#L167-L170) | Fast meter reading schedule identification |

---

### 4. Transactional Services

Three new services ensure atomic operations:

#### TransactionService
**File:** [TransactionService.cs](RentalSystem.Web/Services/TransactionService.cs)

Provides low-level transaction management:

```csharp
// Simple usage
await _transactionService.ExecuteInTransactionAsync(async () =>
{
    // All operations here are atomic
    _context.Invoices.Add(invoice);
    await _context.SaveChangesAsync();
    return invoice;
});

// High isolation for payment processing
await _transactionService.ExecuteInTransactionAsync(
    async () => { /* payments */ },
    IsolationLevel.Serializable  // Prevents all race conditions
);
```

**When to use:** Any operation requiring atomicity (all-or-nothing behavior).

---

#### PaymentService
**File:** [PaymentService.cs](RentalSystem.Web/Services/PaymentService.cs)

Enforces payment business rules:

```csharp
// Creates payment and updates status atomically
var payment = await _paymentService.RecordPaymentAsync(
    invoiceId: 42,
    amount: 500.00m,
    method: PaymentMethod.BankTransfer
);
```

**Features:**
- ✅ Prevents overpayment (validates amount ≤ remaining balance)
- ✅ Automatic status updates (Unpaid → Partial → Paid)
- ✅ Concurrency-safe (detects & rejects concurrent modifications)
- ✅ Transactional (all-or-nothing)

**Constraints:**
- Payment amount must be > 0
- Payment amount must be ≤ remaining balance
- Invoice must exist
- Throws `InvalidOperationException` if constraints violated
- Throws `DbUpdateConcurrencyException` if concurrent modification detected

---

#### InvoiceService
**File:** [InvoiceService.cs](RentalSystem.Web/Services/InvoiceService.cs)

Idempotent invoice generation:

```csharp
// Safe to call multiple times - returns existing invoice if already created
var invoice = await _invoiceService.GetOrCreateInvoiceAsync(
    contractId: 42,
    invoiceDate: new DateTime(2026, 4, 1),
    totalAmount: 1500.00m,
    items: new[] {
        ("Rent", 1000.00m),
        ("Water", 250.00m),
        ("Electric", 250.00m)
    }
);
```

**Features:**
- ✅ Idempotent (calling twice returns same invoice)
- ✅ Concurrent-safe (uses database unique constraint)
- ✅ Automatic item creation
- ✅ Batch generation with `GenerateInvoicesForBuildingAsync()`

**Implementation:**
- Uses `InvoiceKey` format: `{ContractId}_{YYYYMM}`
- Database constraint prevents duplicates
- If race condition occurs (concurrent inserts), automatically uses existing invoice

---

#### ContractService
**File:** [ContractService.cs](RentalSystem.Web/Services/ContractService.cs)

Safe lease creation with double-booking prevention:

```csharp
var contract = await _contractService.CreateLeaseAsync(
    tenantId: 5,
    roomId: 12,
    startDate: new DateTime(2026, 4, 1),
    endDate: new DateTime(2027, 4, 1),
    rentPrice: 1000.00m,
    depositAmount: 2000.00m
);
```

**Validations:**
- ❌ Tenant already has active lease
- ❌ Room already has active lease / is occupied
- ❌ End date ≤ start date
- ❌ Negative rent or deposit
- ✅ All validations run within transaction

**Atomic Operations:**
1. Load & lock tenant
2. Load & lock room
3. Check tenant available
4. Check room available
5. Create contract
6. Update room status to Occupied
7. **Commit or rollback all changes together**

---

### 5. Updated Models

#### Invoice Model
**File:** [Invoice.cs](RentalSystem.Web/Models/Invoice.cs)

Added fields:
- `InvoiceKey` – Idempotency key (format: "{ContractId}_{YYYYMM}")
- `RowVersion` – Concurrency token (timestamp)

#### Payment Model
**File:** [Payment.cs](RentalSystem.Web/Models/Payment.cs)

Added field:
- `RowVersion` – Concurrency token (timestamp)

---

### 6. Updated Controllers

#### LeasesController
**File:** [LeasesController.cs](RentalSystem.Web/Controllers/LeasesController.cs)

**Before:** Manual validation + manual SaveChanges
**After:** Uses `IContractService.CreateLeaseAsync()`

Benefits:
- Single source of truth for lease creation logic
- Atomic operation (transaction wrapper)
- Consistent validation across all callers
- Better error handling

---

#### InvoicesController
**File:** [InvoicesController.cs](RentalSystem.Web/Controllers/InvoicesController.cs)

**Changes:**
1. `GenerateInvoices()` uses `IInvoiceService`
   - Idempotent invoice generation
   - Transactional batch creation
   
2. `RecordPayment()` uses `IPaymentService`
   - Prevents overpayment
   - Automatic status updates
   - Concurrency-safe

---

### 7. Dependency Injection Setup

**File:** [Program.cs](RentalSystem.Web/Program.cs)

```csharp
builder.Services.AddScoped<ITransactionService, TransactionService>();
builder.Services.AddScoped<IPaymentService, PaymentService>();
builder.Services.AddScoped<IInvoiceService, InvoiceService>();
builder.Services.AddScoped<IContractService, ContractService>();
```

All services are registered as scoped (one instance per HTTP request).

---

### 8. Database Migration

**File:** [20260403_AddDataIntegrityConstraints.cs](RentalSystem.Web/Migrations/20260403_AddDataIntegrityConstraints.cs)

**Operations:**
1. Add `InvoiceKey` column to Invoices
2. Add `RowVersion` columns to Invoices & Payments
3. Create unique constraint on `(BuildingId, RoomNumber)`
4. Create unique constraint on `InvoiceKey`
5. Create unique constraint on `(RoomId, MeterType)`
6. Create performance indexes (8 new indexes)

**Run Migration:**
```bash
cd RentalSystem.Web
dotnet ef database update
```

---

## Business Rules Now Enforced

### At Database Level (Cannot Be Bypassed)
1. ✅ Room numbers are unique per building
2. ✅ One meter type per room
3. ✅ One invoice per contract-month pair (idempotency)
4. ✅ Concurrent modifications detected (RowVersion)

### At Application Level (Transaction Services)
1. ✅ Tenant cannot have multiple active leases
2. ✅ Room cannot be leased to multiple tenants simultaneously
3. ✅ Payments cannot exceed invoice balance
4. ✅ Invoice status automatically updates (Unpaid → Partial → Paid)
5. ✅ All operations are atomic (all succeed or all fail)

---

## Testing the Hardening

### Test 1: Duplicate Invoice Prevention
```bash
curl -X POST http://localhost:5000/api/invoices/generate \
  -H "Content-Type: application/json" \
  -d '{"buildingId": 1, "invoiceDate": "2026-04-01", "dueInDays": 5}'

# Run twice - second should return generated:0, skipped:N (idempotent)
```

### Test 2: Overpayment Prevention
```bash
# Attempt to pay $2000 for $1500 invoice
curl -X POST http://localhost:5000/api/invoices/42/payments \
  -H "Content-Type: application/json" \
  -d '{"amount": 2000, "method": "Cash"}'

# Response: 400 Bad Request - "Payment amount exceeds remaining balance"
```

### Test 3: Double-Booking Prevention
```bash
# Attempt to lease room to two tenants
curl -X POST http://localhost:5000/api/leases \
  -H "Content-Type: application/json" \
  -d '{"tenantId": 1, "roomId": 5, ...}'

curl -X POST http://localhost:5000/api/leases \
  -H "Content-Type: application/json" \
  -d '{"tenantId": 2, "roomId": 5, ...}'  # Different tenant, same room

# Response: 409 Conflict - "This room already has an active lease"
```

---

## Performance Considerations

### Index Impact
- 8 new indexes improve query performance
- Trade-off: Slightly slower INSERT/UPDATE/DELETE operations
- Benefit: Significantly faster verification queries (lease validation, invoice lookup)

### Storage
- `RowVersion` columns: ~8 bytes per row (negligible)
- New indexes: ~100KB initially, grows with data

### Query Performance
Example: Finding available rooms for new leases
```
Before: Full table scan → O(n)
After:  Index scan → O(log n)
```

---

## Migration Safety

### Forward Compatibility ✅
- New columns (`InvoiceKey`, `RowVersion`) are nullable
- Existing invoices continue to work (key auto-generated on next save)
- No data loss during migration

### Rollback
```bash
dotnet ef database update 20260403074849_AddUserAuth
```

---

## Next Steps

1. **Run migration** on test database first
2. **Test scenarios** above in test environment
3. **Monitor** for constraint violations in production
4. **Consider** adding:
   - Database audit trail (who modified what)
   - Payment reversal/refund logic
   - Soft deletes with cascading rule enforcement

---

## References

- Entity Framework Core Concurrency: https://learn.microsoft.com/en-us/ef/core/saving/concurrency
- SQL Unique Constraints: https://learn.microsoft.com/en-us/sql/t-sql/statements/create-table-transact-sql-unique-constraint
- Transactions: https://learn.microsoft.com/en-us/ef/core/saving/transactions
