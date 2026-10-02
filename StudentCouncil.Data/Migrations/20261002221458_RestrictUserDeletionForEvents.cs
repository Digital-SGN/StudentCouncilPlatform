using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace StudentCouncil.Data.Migrations
{
    /// <inheritdoc />
    public partial class RestrictUserDeletionForEvents : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Events_AspNetUsers_ResponsibleUserId",
                table: "Events");

            migrationBuilder.AddForeignKey(
                name: "FK_Events_AspNetUsers_ResponsibleUserId",
                table: "Events",
                column: "ResponsibleUserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Events_AspNetUsers_ResponsibleUserId",
                table: "Events");

            migrationBuilder.AddForeignKey(
                name: "FK_Events_AspNetUsers_ResponsibleUserId",
                table: "Events",
                column: "ResponsibleUserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
