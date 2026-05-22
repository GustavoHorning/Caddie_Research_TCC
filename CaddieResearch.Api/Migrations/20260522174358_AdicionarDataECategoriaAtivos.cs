using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CaddieResearch.Api.Migrations
{
    /// <inheritdoc />
    public partial class AdicionarDataECategoriaAtivos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Categoria",
                table: "Ativos",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DataEntrada",
                table: "Ativos",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Categoria",
                table: "Ativos");

            migrationBuilder.DropColumn(
                name: "DataEntrada",
                table: "Ativos");
        }
    }
}
