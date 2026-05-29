using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace StudentCouncil.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddParticipantsFieldsToEvent : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ActualParticipants",
                table: "Events",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "RegisteredParticipants",
                table: "Events",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ActualParticipants",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "RegisteredParticipants",
                table: "Events");
        }
    }
}
