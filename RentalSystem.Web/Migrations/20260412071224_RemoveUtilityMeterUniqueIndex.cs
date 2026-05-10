using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RentalSystem.Web.Migrations
{
    /// <inheritdoc />
    public partial class RemoveUtilityMeterUniqueIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_UtilityMeters_RoomId_Type_Unique",
                table: "UtilityMeters");

            migrationBuilder.AddColumn<string>(
                name: "AddressLine1",
                table: "SystemSettings",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AddressLine2",
                table: "SystemSettings",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PaymentInstructions",
                table: "SystemSettings",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.UpdateData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "AddressLine1", "AddressLine2", "PaymentInstructions" },
                values: new object[] { null, null, null });

            migrationBuilder.CreateIndex(
                name: "IX_UtilityMeters_RoomId_Type",
                table: "UtilityMeters",
                columns: new[] { "RoomId", "Type" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_UtilityMeters_RoomId_Type",
                table: "UtilityMeters");

            migrationBuilder.DropColumn(
                name: "AddressLine1",
                table: "SystemSettings");

            migrationBuilder.DropColumn(
                name: "AddressLine2",
                table: "SystemSettings");

            migrationBuilder.DropColumn(
                name: "PaymentInstructions",
                table: "SystemSettings");

            migrationBuilder.CreateIndex(
                name: "IX_UtilityMeters_RoomId_Type_Unique",
                table: "UtilityMeters",
                columns: new[] { "RoomId", "Type" },
                unique: true);
        }
    }
}
