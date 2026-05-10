using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RentalSystem.Web.Migrations
{
    /// <inheritdoc />
    public partial class AddTenantDocuments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_UtilityMeters_RoomId",
                table: "UtilityMeters");

            migrationBuilder.DropIndex(
                name: "IX_Invoices_ContractId",
                table: "Invoices");

            migrationBuilder.DropIndex(
                name: "IX_Contracts_RoomId",
                table: "Contracts");

            migrationBuilder.DropIndex(
                name: "IX_Contracts_TenantId",
                table: "Contracts");

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "Payments",
                type: "rowversion",
                rowVersion: true,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "InvoiceKey",
                table: "Invoices",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "Invoices",
                type: "rowversion",
                rowVersion: true,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "SystemSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false),
                    CompanyName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    CurrencySymbol = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    DefaultInvoiceDueDays = table.Column<int>(type: "int", nullable: false),
                    DefaultElectricityRate = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    DefaultWaterRate = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    ExchangeRateUsdToKhr = table.Column<decimal>(type: "decimal(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SystemSettings", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TenantDocuments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenantId = table.Column<int>(type: "int", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    DocumentType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    FilePath = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    ContentType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    FileSize = table.Column<long>(type: "bigint", nullable: false),
                    UploadedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TenantDocuments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TenantDocuments_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "SystemSettings",
                columns: new[] { "Id", "CompanyName", "CurrencySymbol", "DefaultElectricityRate", "DefaultInvoiceDueDays", "DefaultWaterRate", "ExchangeRateUsdToKhr" },
                values: new object[] { 1, "RentalMgr", "$", 1000m, 7, 1500m, 4100m });

            migrationBuilder.CreateIndex(
                name: "IX_UtilityMeters_LastReadingDate",
                table: "UtilityMeters",
                column: "LastReadingDate");

            migrationBuilder.CreateIndex(
                name: "IX_UtilityMeters_RoomId_Type_Unique",
                table: "UtilityMeters",
                columns: new[] { "RoomId", "Type" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Rooms_BuildingId_RoomNumber_Unique",
                table: "Rooms",
                columns: new[] { "BuildingId", "RoomNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Rooms_BuildingId_Status",
                table: "Rooms",
                columns: new[] { "BuildingId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_Payments_InvoiceId_Date",
                table: "Payments",
                columns: new[] { "InvoiceId", "Date" });

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_ContractId_Date",
                table: "Invoices",
                columns: new[] { "ContractId", "Date" });

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_InvoiceKey_Unique",
                table: "Invoices",
                column: "InvoiceKey",
                unique: true,
                filter: "[InvoiceKey] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_Status_DueDate",
                table: "Invoices",
                columns: new[] { "Status", "DueDate" });

            migrationBuilder.CreateIndex(
                name: "IX_Contracts_DateRanges",
                table: "Contracts",
                columns: new[] { "StartDate", "EndDate" });

            migrationBuilder.CreateIndex(
                name: "IX_Contracts_RoomId_Status",
                table: "Contracts",
                columns: new[] { "RoomId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_Contracts_TenantId_Status",
                table: "Contracts",
                columns: new[] { "TenantId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_TenantDocuments_TenantId",
                table: "TenantDocuments",
                column: "TenantId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SystemSettings");

            migrationBuilder.DropTable(
                name: "TenantDocuments");

            migrationBuilder.DropIndex(
                name: "IX_UtilityMeters_LastReadingDate",
                table: "UtilityMeters");

            migrationBuilder.DropIndex(
                name: "IX_UtilityMeters_RoomId_Type_Unique",
                table: "UtilityMeters");

            migrationBuilder.DropIndex(
                name: "IX_Rooms_BuildingId_RoomNumber_Unique",
                table: "Rooms");

            migrationBuilder.DropIndex(
                name: "IX_Rooms_BuildingId_Status",
                table: "Rooms");

            migrationBuilder.DropIndex(
                name: "IX_Payments_InvoiceId_Date",
                table: "Payments");

            migrationBuilder.DropIndex(
                name: "IX_Invoices_ContractId_Date",
                table: "Invoices");

            migrationBuilder.DropIndex(
                name: "IX_Invoices_InvoiceKey_Unique",
                table: "Invoices");

            migrationBuilder.DropIndex(
                name: "IX_Invoices_Status_DueDate",
                table: "Invoices");

            migrationBuilder.DropIndex(
                name: "IX_Contracts_DateRanges",
                table: "Contracts");

            migrationBuilder.DropIndex(
                name: "IX_Contracts_RoomId_Status",
                table: "Contracts");

            migrationBuilder.DropIndex(
                name: "IX_Contracts_TenantId_Status",
                table: "Contracts");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "InvoiceKey",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "Invoices");

            migrationBuilder.CreateIndex(
                name: "IX_UtilityMeters_RoomId",
                table: "UtilityMeters",
                column: "RoomId");

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_ContractId",
                table: "Invoices",
                column: "ContractId");

            migrationBuilder.CreateIndex(
                name: "IX_Contracts_RoomId",
                table: "Contracts",
                column: "RoomId");

            migrationBuilder.CreateIndex(
                name: "IX_Contracts_TenantId",
                table: "Contracts",
                column: "TenantId");
        }
    }
}
