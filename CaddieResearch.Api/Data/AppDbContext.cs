using Microsoft.EntityFrameworkCore;
using CaddieResearch.Api.Models;
using CaddieResearch.Models;

namespace CaddieResearch.Api.Data;

public class AppDbContext : DbContext 
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Usuario> Usuarios { get; set; }
    public DbSet<Carteira> Carteiras { get; set; }
    public DbSet<Ativo> Ativos { get; set; }
    public DbSet<Assinatura> Assinaturas { get; set; }
    public DbSet<Favorito> Favoritos { get; set; }
    public DbSet<Relatorio> Relatorios { get; set; }
    public DbSet<Conversa> Conversas { get; set; }
    public DbSet<Mensagem> Mensagens { get; set; }
    public DbSet<RelatorioRevisado> RelatoriosRevisados { get; set; }
    public DbSet<Portfolio> Portfolios { get; set; }
    public DbSet<Posicao> Posicoes { get; set; }
    public DbSet<Aporte> Aportes { get; set; }
    public DbSet<Recomendacao> Recomendacoes { get; set; }
    public DbSet<Evento> Eventos { get; set; }
    public DbSet<MorningCall> MorningCalls { get; set; }
    public DbSet<MorningCallTopico> MorningCallTopicos { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Mensagem>()
            .HasOne(m => m.Remetente)
            .WithMany()
            .HasForeignKey(m => m.RemetenteId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Recomendacao>()
            .HasOne(r => r.Gestor)
            .WithMany()
            .HasForeignKey(r => r.GestorId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Recomendacao>()
            .HasOne(r => r.Cliente)
            .WithMany()
            .HasForeignKey(r => r.ClienteId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<MorningCall>()
            .HasOne(m => m.Gestor)
            .WithMany()
            .HasForeignKey(m => m.GestorId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}