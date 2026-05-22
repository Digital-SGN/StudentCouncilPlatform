using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace StudentCouncil.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddBudgetToEvent : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "Budget",
                table: "Events",
                type: "numeric",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Budget",
                table: "Events");
        }
    }
}
