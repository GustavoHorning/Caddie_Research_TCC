using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CaddieResearch.Api.Migrations
{
    /// <inheritdoc />
    public partial class AzureSync : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Coluna Anotacao em Favoritos (idempotente)
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Favoritos') AND name = 'Anotacao')
                    ALTER TABLE [Favoritos] ADD [Anotacao] nvarchar(500) NULL;
            ");

            // Tabela Portfolios
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Portfolios')
                BEGIN
                    CREATE TABLE [Portfolios] (
                        [Id] int NOT NULL IDENTITY,
                        [UsuarioId] int NOT NULL,
                        [Nome] nvarchar(100) NOT NULL,
                        [DataInicio] datetime2 NOT NULL,
                        CONSTRAINT [PK_Portfolios] PRIMARY KEY ([Id]),
                        CONSTRAINT [FK_Portfolios_Usuarios_UsuarioId] FOREIGN KEY ([UsuarioId]) REFERENCES [Usuarios] ([Id]) ON DELETE CASCADE
                    );
                    CREATE INDEX [IX_Portfolios_UsuarioId] ON [Portfolios] ([UsuarioId]);
                END
            ");

            // Tabela RelatoriosRevisados
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'RelatoriosRevisados')
                BEGIN
                    CREATE TABLE [RelatoriosRevisados] (
                        [Id] int NOT NULL IDENTITY,
                        [UsuarioId] int NOT NULL,
                        [RelatorioId] int NOT NULL,
                        [DataRevisado] datetime2 NOT NULL,
                        CONSTRAINT [PK_RelatoriosRevisados] PRIMARY KEY ([Id]),
                        CONSTRAINT [FK_RelatoriosRevisados_Relatorios_RelatorioId] FOREIGN KEY ([RelatorioId]) REFERENCES [Relatorios] ([Id]) ON DELETE CASCADE,
                        CONSTRAINT [FK_RelatoriosRevisados_Usuarios_UsuarioId] FOREIGN KEY ([UsuarioId]) REFERENCES [Usuarios] ([Id]) ON DELETE CASCADE
                    );
                    CREATE INDEX [IX_RelatoriosRevisados_RelatorioId] ON [RelatoriosRevisados] ([RelatorioId]);
                    CREATE INDEX [IX_RelatoriosRevisados_UsuarioId] ON [RelatoriosRevisados] ([UsuarioId]);
                END
            ");

            // Tabela Aportes
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Aportes')
                BEGIN
                    CREATE TABLE [Aportes] (
                        [Id] int NOT NULL IDENTITY,
                        [PortfolioId] int NOT NULL,
                        [Valor] decimal(18,2) NOT NULL,
                        [Descricao] nvarchar(200) NULL,
                        [DataAporte] datetime2 NOT NULL,
                        [DataRegistro] datetime2 NOT NULL,
                        CONSTRAINT [PK_Aportes] PRIMARY KEY ([Id]),
                        CONSTRAINT [FK_Aportes_Portfolios_PortfolioId] FOREIGN KEY ([PortfolioId]) REFERENCES [Portfolios] ([Id]) ON DELETE CASCADE
                    );
                    CREATE INDEX [IX_Aportes_PortfolioId] ON [Aportes] ([PortfolioId]);
                END
            ");

            // Tabela Posicoes
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Posicoes')
                BEGIN
                    CREATE TABLE [Posicoes] (
                        [Id] int NOT NULL IDENTITY,
                        [PortfolioId] int NOT NULL,
                        [Ticker] nvarchar(20) NOT NULL,
                        [NomeAtivo] nvarchar(100) NOT NULL,
                        [ClasseAtivo] nvarchar(50) NOT NULL,
                        [Quantidade] decimal(18,2) NOT NULL,
                        [PrecoMedio] decimal(18,2) NOT NULL,
                        [DataEntrada] datetime2 NOT NULL,
                        CONSTRAINT [PK_Posicoes] PRIMARY KEY ([Id]),
                        CONSTRAINT [FK_Posicoes_Portfolios_PortfolioId] FOREIGN KEY ([PortfolioId]) REFERENCES [Portfolios] ([Id]) ON DELETE CASCADE
                    );
                    CREATE INDEX [IX_Posicoes_PortfolioId] ON [Posicoes] ([PortfolioId]);
                END
            ");

            // Tabela Recomendacoes
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Recomendacoes')
                BEGIN
                    CREATE TABLE [Recomendacoes] (
                        [Id] int NOT NULL IDENTITY,
                        [GestorId] int NOT NULL,
                        [ClienteId] int NOT NULL,
                        [PortfolioId] int NULL,
                        [Ticker] nvarchar(20) NOT NULL,
                        [NomeAtivo] nvarchar(100) NOT NULL,
                        [ClasseAtivo] nvarchar(50) NOT NULL,
                        [Quantidade] decimal(18,2) NOT NULL,
                        [PrecoSugerido] decimal(18,2) NOT NULL,
                        [Descricao] nvarchar(500) NULL,
                        [Origem] nvarchar(20) NOT NULL,
                        [Status] nvarchar(20) NOT NULL,
                        [DataCriacao] datetime2 NOT NULL,
                        [DataResposta] datetime2 NULL,
                        CONSTRAINT [PK_Recomendacoes] PRIMARY KEY ([Id]),
                        CONSTRAINT [FK_Recomendacoes_Portfolios_PortfolioId] FOREIGN KEY ([PortfolioId]) REFERENCES [Portfolios] ([Id]),
                        CONSTRAINT [FK_Recomendacoes_Usuarios_ClienteId] FOREIGN KEY ([ClienteId]) REFERENCES [Usuarios] ([Id]),
                        CONSTRAINT [FK_Recomendacoes_Usuarios_GestorId] FOREIGN KEY ([GestorId]) REFERENCES [Usuarios] ([Id])
                    );
                    CREATE INDEX [IX_Recomendacoes_ClienteId] ON [Recomendacoes] ([ClienteId]);
                    CREATE INDEX [IX_Recomendacoes_GestorId] ON [Recomendacoes] ([GestorId]);
                    CREATE INDEX [IX_Recomendacoes_PortfolioId] ON [Recomendacoes] ([PortfolioId]);
                END
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Aportes");

            migrationBuilder.DropTable(
                name: "Posicoes");

            migrationBuilder.DropTable(
                name: "Recomendacoes");

            migrationBuilder.DropTable(
                name: "RelatoriosRevisados");

            migrationBuilder.DropTable(
                name: "Portfolios");

            migrationBuilder.DropColumn(
                name: "Anotacao",
                table: "Favoritos");
        }
    }
}
