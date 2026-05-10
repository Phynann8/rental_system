using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RentalSystem.Web.Migrations
{
    /// <inheritdoc />
    public partial class AddDataIntegrityConstraints : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // ====== ADD COLUMNS FOR CONCURRENCY AND IDEMPOTENCY ======

            // Add InvoiceKey column for idempotency (format: "{ContractId}_{YYYYMM}")
            migrationBuilder.AddColumn<string>(
                name: "InvoiceKey",
                table: "Invoices",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            // Add RowVersion (timestamp) to Invoices for optimistic concurrency control
            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "Invoices",
                type: "rowversion",
                rowVersion: true,
                nullable: true);

            // Add RowVersion (timestamp) to Payments for optimistic concurrency control
            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "Payments",
                type: "rowversion",
                rowVersion: true,
                nullable: true);

            // ====== CREATE UNIQUE CONSTRAINTS ======

            // CONSTRAINT 1: Unique room number per building
            // Prevents duplicate room identifiers within the same building (e.g., multiple Room 101s in Building A)
            migrationBuilder.CreateIndex(
                name: "IX_Rooms_BuildingId_RoomNumber_Unique",
                table: "Rooms",
                columns: new[] { "BuildingId", "RoomNumber" },
                unique: true);

            // CONSTRAINT 2: Unique invoice key per contract-period combination
            // Prevents duplicate invoice generation for the same contract in the same month
            // Using a database-level unique constraint ensures idempotency across concurrent requests
            migrationBuilder.CreateIndex(
                name: "IX_Invoices_InvoiceKey_Unique",
                table: "Invoices",
                column: "InvoiceKey",
                unique: true,
                filter: "[InvoiceKey] IS NOT NULL");

            // CONSTRAINT 3: One meter of each type per room
            // A room can have Water, Electric, Gas meters, but not two Water meters
            migrationBuilder.CreateIndex(
                name: "IX_UtilityMeters_RoomId_Type_Unique",
                table: "UtilityMeters",
                columns: new[] { "RoomId", "Type" },
                unique: true);

            // ====== CREATE PERFORMANCE INDEXES ======

            // INDEX 1: Efficient contract queries by tenant status
            // Used when checking if a tenant already has an active lease (prevent double-booking)
            migrationBuilder.CreateIndex(
                name: "IX_Contracts_TenantId_Status",
                table: "Contracts",
                columns: new[] { "TenantId", "Status" });

            // INDEX 2: Efficient contract queries by room status
            // Used when checking if a room already has an active lease (prevent double-booking)
            migrationBuilder.CreateIndex(
                name: "IX_Contracts_RoomId_Status",
                table: "Contracts",
                columns: new[] { "RoomId", "Status" });

            // INDEX 3: Efficient date range queries on contracts
            // Used for lease overlap detection and billing period identification
            migrationBuilder.CreateIndex(
                name: "IX_Contracts_DateRanges",
                table: "Contracts",
                columns: new[] { "StartDate", "EndDate" });

            // INDEX 4: Efficient invoice lookup by contract and date
            // Used when checking for existing invoices before generation (idempotency checks)
            migrationBuilder.CreateIndex(
                name: "IX_Invoices_ContractId_Date",
                table: "Invoices",
                columns: new[] { "ContractId", "Date" });

            // INDEX 5: Efficient invoice queries by status and due date
            // Used for reporting, overdue invoice identification, and payment collection workflows
            migrationBuilder.CreateIndex(
                name: "IX_Invoices_Status_DueDate",
                table: "Invoices",
                columns: new[] { "Status", "DueDate" });

            // INDEX 6: Efficient payment history traversal and audit trail
            // Used when recording payments and for payment dispute resolution
            migrationBuilder.CreateIndex(
                name: "IX_Payments_InvoiceId_Date",
                table: "Payments",
                columns: new[] { "InvoiceId", "Date" });

            // INDEX 7: Room status filtering for building management
            // Used when finding available rooms for new leases
            migrationBuilder.CreateIndex(
                name: "IX_Rooms_BuildingId_Status",
                table: "Rooms",
                columns: new[] { "BuildingId", "Status" });

            // INDEX 8: Last reading date queries for utility meter management
            // Used to identify which meters need reading and for consumption calculations
            migrationBuilder.CreateIndex(
                name: "IX_UtilityMeters_LastReadingDate",
                table: "UtilityMeters",
                column: "LastReadingDate");

            // Re-create the foreign key indexes that may have been dropped (if needed)
            migrationBuilder.CreateIndex(
                name: "IX_Rooms_BuildingId",
                table: "Rooms",
                column: "BuildingId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Drop all newly created indexes
            migrationBuilder.DropIndex(
                name: "IX_Rooms_BuildingId_RoomNumber_Unique",
                table: "Rooms");

            migrationBuilder.DropIndex(
                name: "IX_Invoices_InvoiceKey_Unique",
                table: "Invoices");

            migrationBuilder.DropIndex(
                name: "IX_UtilityMeters_RoomId_Type_Unique",
                table: "UtilityMeters");

            migrationBuilder.DropIndex(
                name: "IX_Contracts_TenantId_Status",
                table: "Contracts");

            migrationBuilder.DropIndex(
                name: "IX_Contracts_RoomId_Status",
                table: "Contracts");

            migrationBuilder.DropIndex(
                name: "IX_Contracts_DateRanges",
                table: "Contracts");

            migrationBuilder.DropIndex(
                name: "IX_Invoices_ContractId_Date",
                table: "Invoices");

            migrationBuilder.DropIndex(
                name: "IX_Invoices_Status_DueDate",
                table: "Invoices");

            migrationBuilder.DropIndex(
                name: "IX_Payments_InvoiceId_Date",
                table: "Payments");

            migrationBuilder.DropIndex(
                name: "IX_Rooms_BuildingId_Status",
                table: "Rooms");

            migrationBuilder.DropIndex(
                name: "IX_UtilityMeters_LastReadingDate",
                table: "UtilityMeters");

            migrationBuilder.DropIndex(
                name: "IX_Rooms_BuildingId",
                table: "Rooms");

            // Remove columns
            migrationBuilder.DropColumn(
                name: "InvoiceKey",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "Payments");
        }
    }
}
