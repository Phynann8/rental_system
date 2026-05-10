# Rental System - Automated Test Guide

## Overview

This document describes the automated test suite for the Rental Management System, covering both backend (.NET) and frontend (React/TypeScript) tests.

## Test Coverage

The test suite includes comprehensive coverage for:

### 1. **Authentication & Login** ✓
- Valid credential authentication
- Invalid password rejection
- Inactive account detection
- Account lockout validation
- Session creation with expiry
- Multi-device session management

**Test Files:**
- Backend: `RentalSystem.Tests/AuthControllerTests.cs`
- Frontend: `tests/api.test.ts` (Authentication Tests section)

**Key Tests:**
- `PasswordSignInAsync_WithValidCredentials_ReturnsSuccessfulLogin`
- `PasswordSignInAsync_WithInvalidPassword_ReturnsFailed`
- `PasswordSignInAsync_WithInactiveUser_ReturnsFailed`
- `PasswordSignInAsync_WithLockedOutUser_ReturnsFailed`

---

### 2. **Tenant & Room Lease Conflicts** ✓
- Prevent multiple active leases per tenant
- Prevent assigning occupied rooms
- Validate lease date ranges
- Support sequential leases on same room
- Track lease status (Active, Ended, Terminated)

**Test Files:**
- Backend: `RentalSystem.Tests/LeaseConflictTests.cs`
- Frontend: `tests/api.test.ts` (Lease Management Tests section)

**Key Tests:**
- `CanCreateLeaseForVacantRoom_WithNoConflicts`
- `CannotCreateTwoActiveLeases_ForSameTenant`
- `CannotCreateLease_ForOccupiedRoom`
- `CanCreateLease_AfterPreviousLeaseEnds`
- `EndDateMustBeAfterStartDate`

---

### 3. **Utility Meter Validation** ✓
- Water and electric meter reading creation
- Non-negative reading validation
- Consumption calculation between readings
- Latest reading retrieval
- Multiple meter types per room
- Reading date tracking

**Test Files:**
- Backend: `RentalSystem.Tests/MeterValidationTests.cs`
- Frontend: `tests/api.test.ts` (Meter Reading Tests section)

**Key Tests:**
- `CanCreateWaterMeterReading`
- `CanCreateElectricMeterReading`
- `CanUpdateMeterReading_WithHigherValue`
- `MeterReadingCannotBeNegative`
- `CanRetrieveLatestMeterReadingForRoom`
- `CalculateConsumption_BetweenTwoReadings`
- `CanStoreMultipleMeterTypes_PerRoom`

---

### 4. **Invoice Generation** ✓
- Rent-only invoice generation
- Utility charge calculation and inclusion
- Decimal precision in amounts
- Automatic invoice numbering
- Duplicate invoice prevention
- Due date configuration
- Active contract filtering

**Test Files:**
- Backend: `RentalSystem.Tests/InvoiceGenerationTests.cs`
- Frontend: `tests/api.test.ts` (Invoice Generation Tests section)

**Key Tests:**
- `CanGenerateInvoiceWithRentOnly`
- `CanGenerateInvoiceWithRentAndUtilities`
- `InvoiceStatusStartsAsUnpaid`
- `CannotGenerateDuplicateInvoicesForSamePeriod`
- `InvoiceDueDate_IsSetCorrectly`
- `CalculateInvoiceAmount_WithDecimalPrecision`
- `OnlyGenerateInvoices_ForActiveContracts`

---

### 5. **Payment Limits & Processing** ✓
- Payment amount validation (positive amounts only)
- Balance limit enforcement
- Partial payment support
- Multiple payment methods (Cash, BankTransfer, QRCode)
- Payment history tracking
- Invoice status updates based on payments
- Remaining balance calculation

**Test Files:**
- Backend: `RentalSystem.Tests/PaymentLimitTests.cs`
- Frontend: `tests/api.test.ts` (Payment Processing Tests section)

**Key Tests:**
- `CanRecordPaymentForUnpaidInvoice`
- `PaymentAmountCannotExceed_RemainingBalance`
- `CanMakeMultiplePartialPayments`
- `CannotRecordNegativePayment`
- `CannotRecordZeroPayment`
- `PaymentMethodsCanBeDifferent`
- `CalculateTotalPaymentsForInvoice`
- `CalculateRemainingBalance`
- `InvoiceStatusUpdates_BasedOnPayments`
- `PaymentDateCanBeDifferentFromInvoiceDate`

---

## Running the Tests

### Backend Tests (.NET)

**Prerequisites:**
```bash
cd RentalSystem.Tests
dotnet restore
```

**Run all tests:**
```bash
dotnet test
```

**Run with verbose output:**
```bash
dotnet test --verbosity normal
```

**Run specific test class:**
```bash
dotnet test --filter "ClassName=RentalSystem.Tests.AuthControllerTests"
```

**Run with code coverage:**
```bash
dotnet test --collect:"XPlat Code Coverage"
```

---

### Frontend Tests (React/TypeScript)

**Prerequisites:**
```bash
cd rentalmgr---professional-property-management
npm install
```

**Run all tests:**
```bash
npm test
```

**Run with UI:**
```bash
npm run test:ui
```

**Run with coverage:**
```bash
npm run test:coverage
```

**Run specific test file:**
```bash
npm test -- api.test.ts
```

**Run tests in watch mode:**
```bash
npm test -- --watch
```

---

## Test Results

### Expected Test Count

- **Backend:** 36 unit tests across 5 test classes
  - AuthControllerTests: 6 tests
  - LeaseConflictTests: 5 tests
  - MeterValidationTests: 8 tests
  - InvoiceGenerationTests: 7 tests
  - PaymentLimitTests: 10 tests

- **Frontend:** 50+ test cases across multiple test suites
  - Authentication Tests: 6 tests
  - Lease Management Tests: 7 tests
  - Invoice Generation Tests: 6 tests
  - Payment Processing Tests: 7 tests
  - Meter Reading Tests: 7 tests
  - Utility Cost Calculation Tests: 4 tests
  - Business Rule Validation Tests: 5 tests

### Coverage Goals

**Target Coverage:**
- Lines: > 80%
- Branches: > 75%
- Functions: > 85%
- Statements: > 80%

---

## Test Architecture

### Backend (XUnit + InMemory Database)

```
RentalSystem.Tests/
├── AuthControllerTests.cs
├── LeaseConflictTests.cs
├── MeterValidationTests.cs
├── InvoiceGenerationTests.cs
└── PaymentLimitTests.cs
```

**Key Components:**
- Uses InMemory EF Core database for isolation
- Moq for mocking services
- XUnit for assertions and test organization
- Each test is independent and can run in any order

### Frontend (Vitest + jsdom)

```
tests/
└── api.test.ts
```

**Configuration:**
- `vitest.config.ts` - Vitest configuration
- `jsdom` environment for DOM testing
- Mock API client for testing API integration
- Support for code coverage reporting

---

## Business Rules Tested

### Authentication Rules
- ✓ Passwords must match user records
- ✓ Inactive accounts are denied access
- ✓ Account lockout after failed attempts
- ✓ Session expiry is enforced
- ✓ Multi-device sessions are tracked independently

### Lease Rules
- ✓ One active lease per tenant maximum
- ✓ Occupied rooms cannot be leased
- ✓ Lease end date must be after start date
- ✓ Room status reflects occupancy
- ✓ Previous leases don't conflict with new leases

### Meter Rules
- ✓ Readings must be non-negative
- ✓ Multiple meter types per room are supported
- ✓ Latest reading is tracked
- ✓ Consumption is calculated correctly
- ✓ Reading dates are recorded

### Invoice Rules
- ✓ Invoices include rent + utilities
- ✓ Only one invoice per contract per period
- ✓ Decimal precision is maintained
- ✓ Due dates are configurable
- ✓ Invoices only generate for active contracts

### Payment Rules
- ✓ Payments must be positive
- ✓ Payment cannot exceed remaining balance
- ✓ Multiple partial payments are allowed
- ✓ Different payment methods are supported
- ✓ Invoice status updates with payment progress
- ✓ Payment history is maintained

---

## Adding New Tests

### Backend Test Template

```csharp
[Fact]
public async Task TestName_Condition_ExpectedResult()
{
    // Arrange
    using var context = CreateTestDbContext();
    // Setup test data
    
    // Act
    // Execute the code being tested
    
    // Assert
    // Verify results
}
```

### Frontend Test Template

```typescript
it('should test specific behavior', () => {
  // Arrange
  const testData = { /* ... */ };
  
  // Act
  const result = performAction(testData);
  
  // Assert
  expect(result).toBe(expectedValue);
});
```

---

## Continuous Integration

To integrate with CI/CD pipelines:

**GitHub Actions Example:**
```yaml
- name: Run Backend Tests
  run: dotnet test --verbosity normal

- name: Run Frontend Tests
  run: npm run test:coverage
```

---

## Known Limitations

### Backend Tests
- DbContext configuration may require additional setup for complex migrations
- Some tests require proper EF Core version alignment
- Integration tests should be run separately from unit tests

### Frontend Tests
- API mocking uses simplified client
- Full integration tests with real backend should be added
- UI component testing may require additional setup

---

## Future Improvements

- [ ] Add integration tests with real database
- [ ] Add E2E tests with Cypress/Playwright
- [ ] Add performance/load tests
- [ ] Add mutation testing
- [ ] Generate HTML coverage reports
- [ ] Add pre-commit hooks for test execution
- [ ] Add test coverage enforcement in CI/CD

---

## Troubleshooting

### Backend Tests Fail with DbContext Error

**Solution:** Ensure all NuGet packages are restored:
```bash
dotnet clean
dotnet restore
dotnet test
```

### Frontend Tests Not Running

**Solution:** Install dependencies:
```bash
npm install
npm test
```

### Coverage Report Not Generated

**Solution:** Ensure provider is configured:
```bash
npm run test:coverage
```

---

## Contact & Support

For issues or questions about the test suite, please refer to the project documentation or create an issue in the project repository.

**Test Maintenance:**
- Review and update tests when business rules change
- Add tests before fixing bugs (TDD approach)
- Maintain > 80% code coverage
- Run tests before committing changes
