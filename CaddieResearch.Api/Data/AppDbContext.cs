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
}