using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CaddieResearch.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddHistoricoCarteiras : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "HistoricoRecomendacoesCarteiras",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CarteiraId = table.Column<int>(type: "int", nullable: false),
                    GestorId = table.Column<int>(type: "int", nullable: false),
                    Ticker = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    NomeAtivo = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Vies = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    PrecoAlvo = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Justificativa = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    DataRecomendacao = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HistoricoRecomendacoesCarteiras", x => x.Id);
                    table.ForeignKey(
                        name: "FK_HistoricoRecomendacoesCarteiras_Carteiras_CarteiraId",
                        column: x => x.CarteiraId,
                        principalTable: "Carteiras",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_HistoricoRecomendacoesCarteiras_Usuarios_GestorId",
                        column: x => x.GestorId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_HistoricoRecomendacoesCarteiras_CarteiraId",
                table: "HistoricoRecomendacoesCarteiras",
                column: "CarteiraId");

            migrationBuilder.CreateIndex(
                name: "IX_HistoricoRecomendacoesCarteiras_GestorId",
                table: "HistoricoRecomendacoesCarteiras",
                column: "GestorId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "HistoricoRecomendacoesCarteiras");
        }
    }
}
