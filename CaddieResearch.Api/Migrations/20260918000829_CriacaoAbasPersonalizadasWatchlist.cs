using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CaddieResearch.Api.Migrations
{
    /// <inheritdoc />
    public partial class CriacaoAbasPersonalizadasWatchlist : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "WatchlistAbas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UsuarioId = table.Column<int>(type: "int", nullable: false),
                    Nome = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    DataCriacao = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WatchlistAbas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WatchlistAbas_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "WatchlistAbaFavoritos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    WatchlistAbaId = table.Column<int>(type: "int", nullable: false),
                    FavoritoId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WatchlistAbaFavoritos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WatchlistAbaFavoritos_Favoritos_FavoritoId",
                        column: x => x.FavoritoId,
                        principalTable: "Favoritos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WatchlistAbaFavoritos_WatchlistAbas_WatchlistAbaId",
                        column: x => x.WatchlistAbaId,
                        principalTable: "WatchlistAbas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_WatchlistAbaFavoritos_FavoritoId",
                table: "WatchlistAbaFavoritos",
                column: "FavoritoId");

            migrationBuilder.CreateIndex(
                name: "IX_WatchlistAbaFavoritos_WatchlistAbaId",
                table: "WatchlistAbaFavoritos",
                column: "WatchlistAbaId");

            migrationBuilder.CreateIndex(
                name: "IX_WatchlistAbas_UsuarioId",
                table: "WatchlistAbas",
                column: "UsuarioId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "WatchlistAbaFavoritos");

            migrationBuilder.DropTable(
                name: "WatchlistAbas");
        }
    }
}
