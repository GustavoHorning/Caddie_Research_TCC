using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CaddieResearch.Api.Migrations
{
    /// <inheritdoc />
    public partial class AdicionaIndexacaoAgressivaPdfs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ConteudoPdfTexto",
                table: "Relatorios",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ConteudoPdfTexto",
                table: "Relatorios");
        }
    }
}
