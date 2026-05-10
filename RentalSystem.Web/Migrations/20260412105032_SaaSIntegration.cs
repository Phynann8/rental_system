using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RentalSystem.Web.Migrations
{
    /// <inheritdoc />
    public partial class SaaSIntegration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "OrganizationId",
                table: "UtilityMeters",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "OrganizationId",
                table: "UserAccounts",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<Guid>(
                name: "SetupToken",
                table: "UserAccounts",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "SetupTokenExpiresAtUtc",
                table: "UserAccounts",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TenantId",
                table: "UserAccounts",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "OrganizationId",
                table: "Tenants",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "OrganizationId",
                table: "TenantDocuments",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.Sql("DROP TABLE [SystemSettings]");

            migrationBuilder.Sql(@"
                CREATE TABLE [SystemSettings] (
                    [Id] int NOT NULL IDENTITY(1, 1),
                    [OrganizationId] int NOT NULL,
                    [CompanyName] nvarchar(200) NOT NULL,
                    [AddressLine1] nvarchar(200) NULL,
                    [AddressLine2] nvarchar(200) NULL,
                    [CurrencySymbol] nvarchar(10) NOT NULL,
                    [DefaultInvoiceDueDays] int NOT NULL,
                    [DefaultElectricityRate] decimal(18,2) NOT NULL,
                    [DefaultWaterRate] decimal(18,2) NOT NULL,
                    [ExchangeRateUsdToKhr] decimal(18,2) NOT NULL,
                    [PaymentInstructions] nvarchar(1000) NULL,
                    CONSTRAINT [PK_SystemSettings] PRIMARY KEY ([Id])
                )");

            migrationBuilder.AddColumn<int>(
                name: "OrganizationId",
                table: "RoomTypes",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "OrganizationId",
                table: "Rooms",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "IsVerified",
                table: "Payments",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "OrganizationId",
                table: "Payments",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "ReceiptPath",
                table: "Payments",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TenantNotes",
                table: "Payments",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VerificationNotes",
                table: "Payments",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "OrganizationId",
                table: "Notifications",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "OrganizationId",
                table: "MaintenanceTickets",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "OrganizationId",
                table: "Invoices",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "OrganizationId",
                table: "InvoiceItems",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "OrganizationId",
                table: "Contracts",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "OrganizationId",
                table: "Buildings",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "OrganizationId",
                table: "AuditLogs",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "Organizations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    SubscriptionTier = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Organizations", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Subscriptions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    OrganizationId = table.Column<int>(type: "int", nullable: false),
                    Tier = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    StartDateUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EndDateUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    TrialEndsUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    MonthlyPrice = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Subscriptions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Subscriptions_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            // Handled via recreation

            migrationBuilder.CreateIndex(
                name: "IX_UserAccounts_OrganizationId",
                table: "UserAccounts",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_UserAccounts_TenantId",
                table: "UserAccounts",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_Date",
                table: "Payments",
                column: "Date");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_IsRead_CreatedAt",
                table: "Notifications",
                columns: new[] { "IsRead", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceTickets_CreatedAt",
                table: "MaintenanceTickets",
                column: "CreatedAtUtc");

            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceTickets_Status_Priority",
                table: "MaintenanceTickets",
                columns: new[] { "Status", "Priority" });

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_Status_Date",
                table: "Invoices",
                columns: new[] { "Status", "Date" });

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_EntityName_Timestamp",
                table: "AuditLogs",
                columns: new[] { "EntityName", "TimestampUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_Timestamp",
                table: "AuditLogs",
                column: "TimestampUtc");

            migrationBuilder.CreateIndex(
                name: "IX_Subscriptions_OrganizationId",
                table: "Subscriptions",
                column: "OrganizationId");

            migrationBuilder.AddForeignKey(
                name: "FK_UserAccounts_Organizations_OrganizationId",
                table: "UserAccounts",
                column: "OrganizationId",
                principalTable: "Organizations",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_UserAccounts_Tenants_TenantId",
                table: "UserAccounts",
                column: "TenantId",
                principalTable: "Tenants",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_UserAccounts_Organizations_OrganizationId",
                table: "UserAccounts");

            migrationBuilder.DropForeignKey(
                name: "FK_UserAccounts_Tenants_TenantId",
                table: "UserAccounts");

            migrationBuilder.DropTable(
                name: "Subscriptions");

            migrationBuilder.DropTable(
                name: "Organizations");

            migrationBuilder.DropIndex(
                name: "IX_UserAccounts_OrganizationId",
                table: "UserAccounts");

            migrationBuilder.DropIndex(
                name: "IX_UserAccounts_TenantId",
                table: "UserAccounts");

            migrationBuilder.DropIndex(
                name: "IX_Payments_Date",
                table: "Payments");

            migrationBuilder.DropIndex(
                name: "IX_Notifications_IsRead_CreatedAt",
                table: "Notifications");

            migrationBuilder.DropIndex(
                name: "IX_MaintenanceTickets_CreatedAt",
                table: "MaintenanceTickets");

            migrationBuilder.DropIndex(
                name: "IX_MaintenanceTickets_Status_Priority",
                table: "MaintenanceTickets");

            migrationBuilder.DropIndex(
                name: "IX_Invoices_Status_Date",
                table: "Invoices");

            migrationBuilder.DropIndex(
                name: "IX_AuditLogs_EntityName_Timestamp",
                table: "AuditLogs");

            migrationBuilder.DropIndex(
                name: "IX_AuditLogs_Timestamp",
                table: "AuditLogs");

            migrationBuilder.DropColumn(
                name: "OrganizationId",
                table: "UtilityMeters");

            migrationBuilder.DropColumn(
                name: "OrganizationId",
                table: "UserAccounts");

            migrationBuilder.DropColumn(
                name: "SetupToken",
                table: "UserAccounts");

            migrationBuilder.DropColumn(
                name: "SetupTokenExpiresAtUtc",
                table: "UserAccounts");

            migrationBuilder.DropColumn(
                name: "TenantId",
                table: "UserAccounts");

            migrationBuilder.DropColumn(
                name: "OrganizationId",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "OrganizationId",
                table: "TenantDocuments");

            // Handled via DropTable/CreateTable

            migrationBuilder.DropColumn(
                name: "OrganizationId",
                table: "RoomTypes");

            migrationBuilder.DropColumn(
                name: "OrganizationId",
                table: "Rooms");

            migrationBuilder.DropColumn(
                name: "IsVerified",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "OrganizationId",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "ReceiptPath",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "TenantNotes",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "VerificationNotes",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "OrganizationId",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "OrganizationId",
                table: "MaintenanceTickets");

            migrationBuilder.DropColumn(
                name: "OrganizationId",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "OrganizationId",
                table: "InvoiceItems");

            migrationBuilder.DropColumn(
                name: "OrganizationId",
                table: "Contracts");

            migrationBuilder.DropColumn(
                name: "OrganizationId",
                table: "Buildings");

            migrationBuilder.DropColumn(
                name: "OrganizationId",
                table: "AuditLogs");

            // Revert identity not supported simple
        }
    }
}
