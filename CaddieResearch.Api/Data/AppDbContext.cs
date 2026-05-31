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
    public DbSet<Conversa> Conversas { get; set; }
    public DbSet<Mensagem> Mensagens { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Evita múltiplos caminhos de CASCADE DELETE no SQL Server
        modelBuilder.Entity<Mensagem>()
            .HasOne(m => m.Remetente)
            .WithMany()
            .HasForeignKey(m => m.RemetenteId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}