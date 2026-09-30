using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using CaddieResearch.Models;

namespace CaddieResearch.Api.Models;

public class HistoricoRecomendacaoCarteira
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int CarteiraId { get; set; }

    [ForeignKey("CarteiraId")]
    public Carteira? Carteira { get; set; }

    [Required]
    public int GestorId { get; set; }

    [ForeignKey("GestorId")]
    public Usuario? Gestor { get; set; }

    [Required]
    [MaxLength(20)]
    public string Ticker { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string NomeAtivo { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string Acao { get; set; } = string.Empty; // "Adicionou", "Atualizou", "Excluiu"

    [Required]
    [MaxLength(20)]
    public string Vies { get; set; } = string.Empty; // Comprar, Vender, Aguardar

    public decimal PrecoAlvo { get; set; }

    [MaxLength(500)]
    public string? Justificativa { get; set; }

    public DateTime DataRecomendacao { get; set; } = DateTime.UtcNow;
}