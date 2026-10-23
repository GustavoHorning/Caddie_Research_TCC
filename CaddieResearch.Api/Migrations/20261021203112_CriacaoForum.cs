using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CaddieResearch.Api.Migrations
{
    /// <inheritdoc />
    public partial class CriacaoForum : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ForumTopicos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AutorId = table.Column<int>(type: "int", nullable: false),
                    Titulo = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Conteudo = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Categoria = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    MotivoRecusa = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    DataCriacao = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DataModeracao = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ForumTopicos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ForumTopicos_Usuarios_AutorId",
                        column: x => x.AutorId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ForumCurtidas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TopicoId = table.Column<int>(type: "int", nullable: false),
                    UsuarioId = table.Column<int>(type: "int", nullable: false),
                    DataCriacao = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ForumCurtidas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ForumCurtidas_ForumTopicos_TopicoId",
                        column: x => x.TopicoId,
                        principalTable: "ForumTopicos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ForumRespostas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TopicoId = table.Column<int>(type: "int", nullable: false),
                    AutorId = table.Column<int>(type: "int", nullable: false),
                    Conteudo = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DataCriacao = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ForumRespostas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ForumRespostas_ForumTopicos_TopicoId",
                        column: x => x.TopicoId,
                        principalTable: "ForumTopicos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ForumRespostas_Usuarios_AutorId",
                        column: x => x.AutorId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ForumRespostaCurtidas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RespostaId = table.Column<int>(type: "int", nullable: false),
                    UsuarioId = table.Column<int>(type: "int", nullable: false),
                    DataCriacao = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ForumRespostaCurtidas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ForumRespostaCurtidas_ForumRespostas_RespostaId",
                        column: x => x.RespostaId,
                        principalTable: "ForumRespostas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ForumCurtidas_TopicoId_UsuarioId",
                table: "ForumCurtidas",
                columns: new[] { "TopicoId", "UsuarioId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ForumRespostaCurtidas_RespostaId_UsuarioId",
                table: "ForumRespostaCurtidas",
                columns: new[] { "RespostaId", "UsuarioId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ForumRespostas_AutorId",
                table: "ForumRespostas",
                column: "AutorId");

            migrationBuilder.CreateIndex(
                name: "IX_ForumRespostas_TopicoId",
                table: "ForumRespostas",
                column: "TopicoId");

            migrationBuilder.CreateIndex(
                name: "IX_ForumTopicos_AutorId",
                table: "ForumTopicos",
                column: "AutorId");

            migrationBuilder.CreateIndex(
                name: "IX_ForumTopicos_Status_DataCriacao",
                table: "ForumTopicos",
                columns: new[] { "Status", "DataCriacao" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ForumCurtidas");

            migrationBuilder.DropTable(
                name: "ForumRespostaCurtidas");

            migrationBuilder.DropTable(
                name: "ForumRespostas");

            migrationBuilder.DropTable(
                name: "ForumTopicos");
        }
    }
}
