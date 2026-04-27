using System;
using System.ComponentModel.DataAnnotations;

namespace CaddieResearch.Api.Models;

public class Usuario
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Nome { get; set; } = string.Empty;

    [Required]
    [MaxLength(150)]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string SenhaHash { get; set; } = string.Empty;
    
    public bool EmailConfirmado { get; set; } = false; 

    [Required]
    [MaxLength(20)]
    public string TipoPerfil { get; set; } = "Assinante";

    public DateTime DataCriacao { get; set; } = DateTime.UtcNow;
    public string? CodigoRecuperacao { get; set; }
    public DateTime? DataExpiracaoCodigo { get; set; }
    public ICollection<Assinatura>? Assinaturas { get; set; }
}