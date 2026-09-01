using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CaddieResearch.Api.Migrations
{
    /// <inheritdoc />
    public partial class AjusteRelacionamentoMorningCall : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MorningCalls_Usuarios_GestorId",
                table: "MorningCalls");

            migrationBuilder.AddForeignKey(
                name: "FK_MorningCalls_Usuarios_GestorId",
                table: "MorningCalls",
                column: "GestorId",
                principalTable: "Usuarios",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MorningCalls_Usuarios_GestorId",
                table: "MorningCalls");

            migrationBuilder.AddForeignKey(
                name: "FK_MorningCalls_Usuarios_GestorId",
                table: "MorningCalls",
                column: "GestorId",
                principalTable: "Usuarios",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
