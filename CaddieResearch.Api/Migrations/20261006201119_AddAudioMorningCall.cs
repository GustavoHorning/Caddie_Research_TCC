using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CaddieResearch.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddAudioMorningCall : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AudioUrl",
                table: "MorningCalls",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AudioUrl",
                table: "MorningCalls");
        }
    }
}
