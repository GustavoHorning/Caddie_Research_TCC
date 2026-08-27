using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CaddieResearch.Api.Migrations
{
    /// <inheritdoc />
    public partial class AdicionandoDetalhesAoEvento : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PossuiLink",
                table: "Eventos");

            migrationBuilder.AddColumn<string>(
                name: "Pais",
                table: "Eventos",
                type: "nvarchar(5)",
                maxLength: 5,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Pais",
                table: "Eventos");

            migrationBuilder.AddColumn<bool>(
                name: "PossuiLink",
                table: "Eventos",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }
    }
}
