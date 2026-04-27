using Microsoft.EntityFrameworkCore;
using CaddieResearch.Api.Models;

namespace CaddieResearch.Api.Data;

public class AppDbContext : DbContext 
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Usuario> Usuarios { get; set; }
    public DbSet<Assinatura> Assinaturas { get; set; }
}