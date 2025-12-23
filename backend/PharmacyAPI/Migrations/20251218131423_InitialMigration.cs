using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PharmacyAPI.Migrations
{
    /// <inheritdoc />
    public partial class InitialMigration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SaleItemss_Medicines_MedicineId",
                table: "SaleItemss");

            migrationBuilder.DropForeignKey(
                name: "FK_SaleItemss_Sales_SaleId",
                table: "SaleItemss");

            migrationBuilder.DropPrimaryKey(
                name: "PK_SaleItemss",
                table: "SaleItemss");

            migrationBuilder.RenameTable(
                name: "SaleItemss",
                newName: "SaleItems");

            migrationBuilder.RenameIndex(
                name: "IX_SaleItemss_SaleId",
                table: "SaleItems",
                newName: "IX_SaleItems_SaleId");

            migrationBuilder.RenameIndex(
                name: "IX_SaleItemss_MedicineId",
                table: "SaleItems",
                newName: "IX_SaleItems_MedicineId");

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "Users",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddPrimaryKey(
                name: "PK_SaleItems",
                table: "SaleItems",
                column: "Id");

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "Email", "IsActive", "Name", "PasswordHash", "Role" },
                values: new object[] { 1, "admin@pharmacy.com", true, "System Admin", "$2a$11$zPcmgWnHq0LIX4.IuXXfCOaGvwtJdl2JBaLnxARgqK5nYTsXO0sgO", "Admin" });

            migrationBuilder.AddForeignKey(
                name: "FK_SaleItems_Medicines_MedicineId",
                table: "SaleItems",
                column: "MedicineId",
                principalTable: "Medicines",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SaleItems_Sales_SaleId",
                table: "SaleItems",
                column: "SaleId",
                principalTable: "Sales",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SaleItems_Medicines_MedicineId",
                table: "SaleItems");

            migrationBuilder.DropForeignKey(
                name: "FK_SaleItems_Sales_SaleId",
                table: "SaleItems");

            migrationBuilder.DropPrimaryKey(
                name: "PK_SaleItems",
                table: "SaleItems");

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "Users");

            migrationBuilder.RenameTable(
                name: "SaleItems",
                newName: "SaleItemss");

            migrationBuilder.RenameIndex(
                name: "IX_SaleItems_SaleId",
                table: "SaleItemss",
                newName: "IX_SaleItemss_SaleId");

            migrationBuilder.RenameIndex(
                name: "IX_SaleItems_MedicineId",
                table: "SaleItemss",
                newName: "IX_SaleItemss_MedicineId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_SaleItemss",
                table: "SaleItemss",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_SaleItemss_Medicines_MedicineId",
                table: "SaleItemss",
                column: "MedicineId",
                principalTable: "Medicines",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SaleItemss_Sales_SaleId",
                table: "SaleItemss",
                column: "SaleId",
                principalTable: "Sales",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
