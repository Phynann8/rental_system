# Deployment Checklist - Data Integrity Hardening

## Pre-Deployment

- [ ] **Code Review**
  - [ ] Review [DATA_INTEGRITY.md](DATA_INTEGRITY.md) for understanding
  - [ ] Review service implementations in `/Services/`
  - [ ] Review controller changes in `/Controllers/`

- [ ] **Build Verification**
  ```bash
  cd RentalSystem.Web
  dotnet build
  # Should complete with "Build succeeded"
  ```

- [ ] **Test Environment Setup**
  ```bash
  # Create test database backup
  dotnet ef database update --project RentalSystem.Web
  ```

- [ ] **Run Unit Tests** (if applicable)
  ```bash
  dotnet test RentalSystem.Tests
  ```

---

## Local Testing

### Test Scenario 1: Duplicate Invoice Prevention
- [ ] Generate invoices for April 2026
- [ ] Run generate again with same month
- [ ] Verify response shows `generated: 0, skipped: N` (idempotent)

### Test Scenario 2: Overpayment Prevention
- [ ] Create invoice with $1000 balance
- [ ] Attempt payment of $2000
- [ ] Verify 400 Bad Request response

### Test Scenario 3: Double-Booking Prevention
- [ ] Create lease: Tenant 1 → Room 5
- [ ] Attempt lease: Tenant 2 → Room 5
- [ ] Verify 409 Conflict response

### Test Scenario 4: Duplicate Room Prevention
- [ ] In database, try inserting two "Room 101" in same building
- [ ] Verify unique constraint violation

---

## Staging/UAT Testing

### Database Migration
- [ ] Create backup of staging database
- [ ] Run migration:
  ```bash
  dotnet ef database update --project RentalSystem.Web
  ```
- [ ] Verify migration applied:
  ```sql
  SELECT * FROM __EFMigrationsHistory 
  WHERE MigrationId LIKE '%AddDataIntegrityConstraints%'
  ```

### Data Verification
- [ ] Check no existing data violates constraints:
  ```sql
  -- Check for duplicate room numbers
  SELECT BuildingId, RoomNumber, COUNT(*) 
  FROM Rooms 
  GROUP BY BuildingId, RoomNumber 
  HAVING COUNT(*) > 1  -- Should return 0 rows
  
  -- Check for duplicate invoices in same month
  SELECT ContractId, DATEPART(YEAR, Date), DATEPART(MONTH, Date), COUNT(*)
  FROM Invoices
  GROUP BY ContractId, DATEPART(YEAR, Date), DATEPART(MONTH, Date)
  HAVING COUNT(*) > 1  -- Should return 0 rows
  ```

### Performance Testing
- [ ] Run typical queries (should be faster):
  ```csharp
  // Available rooms query (uses index)
  var rooms = await _context.Rooms
      .Where(r => r.BuildingId == 1 && r.Status == RoomStatus.Vacant)
      .ToListAsync();
  
  // Monitor query time
  ```

### Concurrent Load Testing
- [ ] Simulate multiple simultaneous invoice generations
- [ ] Simulate multiple simultaneous payments
- [ ] Monitor for `DbUpdateConcurrencyException` (expected)
- [ ] Verify application handles gracefully (returns 409 Conflict)

---

## Production Deployment

### Pre-Deployment Checklist
- [ ] Code reviewed and approved
- [ ] All tests passing in staging
- [ ] Database backup created
- [ ] Deployment window scheduled (off-peak)
- [ ] Rollback plan documented and tested
- [ ] Monitoring alerts configured

### Step 1: Database Migration
```bash
# SSH into server
cd /path/to/RentalSystem.Web

# Backup database (replace with your backup command)
# Example for SQL Server:
sqlcmd -S <server> -U <user> -P <pass> -Q "BACKUP DATABASE [RentalDb] TO DISK='D:\Backups\RentalDb_PreIntegrity.bak'"

# Apply migration
dotnet ef database update --project RentalSystem.Web

# Verify migration applied
sqlcmd -S <server> -U <user> -P <pass> -Q "SELECT * FROM __EFMigrationsHistory WHERE MigrationId LIKE '%AddDataIntegrityConstraints%'"
```

### Step 2: Application Deployment
- [ ] Deploy new application code (includes service updates)
- [ ] Restart application:
  ```bash
  # If using IIS
  iisreset
  
  # If using Docker
  docker restart <container_name>
  
  # If using systemd
  systemctl restart rentalsystem
  ```

### Step 3: Smoke Testing
- [ ] Application starts without errors
- [ ] Login works
- [ ] Can view invoices
- [ ] Can create leases
- [ ] Can record payments
- [ ] Check application logs for errors

### Step 4: Monitoring
- [ ] Monitor error logs for constraint violations
- [ ] Monitor concurrency exceptions
- [ ] Check query performance (should improve)
- [ ] Monitor database blocking

---

## Monitoring & Alerting

### Alert Conditions (Set Up)

| Condition | Action |
|-----------|--------|
| `DbUpdateException` with "UNIQUE KEY constraint" | ERROR - indicates app logic issue |
| `DbUpdateConcurrencyException` > 10/min | WARNING - high concurrent load |
| Invoice generation taking > 5 seconds | WARNING - performance degradation |
| Payment recording taking > 2 seconds | WARNING - performance issue |

### Logging to Configure

```csharp
// In appsettings.Production.json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "RentalSystem.Web.Services": "Debug",  // Log service operations
      "Microsoft.EntityFrameworkCore": "Warning"  // Log EF Core warnings
    }
  }
}
```

---

## Rollback Plan

### If Critical Issue Found

```bash
# Step 1: Stop application
systemctl stop rentalsystem

# Step 2: Restore database backup
sqlcmd -S <server> -U <user> -P <pass> \
  -Q "RESTORE DATABASE [RentalDb] FROM DISK='D:\Backups\RentalDb_PreIntegrity.bak'"

# Step 3: Rollback to previous application version
git checkout <previous_commit>
dotnet build -c Release

# Step 4: Restart application
systemctl start rentalsystem

# Step 5: Verify working
curl http://localhost/api/invoices
```

### If Database Migration Can't Be Rolled Back

```bash
# Rollback migration (removes constraints/indexes but keeps data)
dotnet ef database update 20260403074849_AddUserAuth

# This removes:
# - InvoiceKey column (nullable, safe)
# - RowVersion columns (safe - not used)
# - Unique constraints
# - Performance indexes
# Note: Data integrity enforcement is lost, but data is intact
```

---

## Post-Deployment Verification

### After 24 Hours
- [ ] No unexpected errors in logs
- [ ] All business operations working normally
- [ ] No constraint violations reported
- [ ] Database performance metrics normal
- [ ] User reports (if any) handled

### After 1 Week
- [ ] Performance improvements verified
- [ ] No data integrity issues found
- [ ] Concurrent operation handling working
- [ ] Cost analysis (index storage impact acceptable)

### After 1 Month
- [ ] Query performance improvements sustained
- [ ] No regressions
- [ ] Documentation updated if needed
- [ ] Team trained on new error handling patterns

---

## Documentation

### For Developers
- [ ] Share [DATA_INTEGRITY_QUICKREF.md](DATA_INTEGRITY_QUICKREF.md)
- [ ] Point to service implementations as examples
- [ ] Document expected exceptions in API docs

### For Support/Ops
- [ ] Document constraint violation scenarios & fixes
- [ ] Document concurrency exception handling
- [ ] Include monitoring alert responses

### For Database Admins
- [ ] Explain new indexes (8 total)
- [ ] Document backup procedures
- [ ] Document maintenance scripts

---

## Success Criteria

After deployment, verify:

- [ ] ✅ Duplicate invoices cannot be created
- [ ] ✅ Room numbers are unique per building
- [ ] ✅ Overpayment is prevented
- [ ] ✅ Double-booking is prevented
- [ ] ✅ Concurrent modifications handled gracefully
- [ ] ✅ Query performance improved
- [ ] ✅ No data losses or corruption
- [ ] ✅ All business operations functional

---

## Timeline

| Phase | Duration | Action |
|-------|----------|--------|
| Pre-Deployment | 1-2 days | Code review, local testing |
| Staging Testing | 1-3 days | Database migration, scenario testing |
| Deployment Window | 30 minutes | Migration + app restart for production |
| Stabilization | 24 hours | Monitoring, smoke testing, support standing by |
| Verification | 1 week | Performance analysis, user feedback collection |

---

## Emergency Contacts

| Role | Contact | Notes |
|------|---------|-------|
| Database Admin | [Name/Phone] | For rollback/recovery |
| Infrastructure | [Name/Phone] | For application restart |
| Development Lead | [Name/Phone] | For emergency code fixes |
| Product Owner | [Name/Phone] | For business impact decisions |

---

## Sign-Off

- [ ] **QA Lead**: _________________________ Date: _______
- [ ] **Tech Lead**: _________________________ Date: _______
- [ ] **Product Owner**: _________________________ Date: _______
- [ ] **Ops/DevOps**: _________________________ Date: _______

---

**Deployment Package Ready** ✅

For any questions, see [DATA_INTEGRITY.md](DATA_INTEGRITY.md) or [DATA_INTEGRITY_QUICKREF.md](DATA_INTEGRITY_QUICKREF.md)
