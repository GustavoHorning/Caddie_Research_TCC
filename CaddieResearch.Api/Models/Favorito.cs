using System.ComponentModel.DataAnnotations;
using CaddieResearch.Api.Models;

namespace CaddieResearch.Api.Models;

public class Favorito
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int UsuarioId { get; set; }
    public Usuario? Usuario { get; set; }

    [Required]
    [MaxLength(100)]
    public string Ticker { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? NomeEmpresa { get; set; }

    [MaxLength(50)]
    public string? Categoria { get; set; }

    [MaxLength(50)]
    public string? Rentabilidade { get; set; }

    [MaxLength(100)]
    public string? NomeCarteira { get; set; }

    public DateTime DataAdicionado { get; set; } = DateTime.UtcNow;

    [MaxLength(500)]
    public string? Anotacao { get; set; }
}