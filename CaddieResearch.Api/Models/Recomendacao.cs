using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CaddieResearch.Api.Models;

public class Recomendacao
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int GestorId { get; set; }

    [ForeignKey("GestorId")]
    public Usuario? Gestor { get; set; }

    [Required]
    public int ClienteId { get; set; }

    [ForeignKey("ClienteId")]
    public Usuario? Cliente { get; set; }

    public int? PortfolioId { get; set; }

    [ForeignKey("PortfolioId")]
    public Portfolio? Portfolio { get; set; }

    [Required]
    [MaxLength(20)]
    public string Ticker { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string NomeAtivo { get; set; } = string.Empty;

    [MaxLength(50)]
    public string ClasseAtivo { get; set; } = "Renda Variável";

    public decimal Quantidade { get; set; }

    public decimal PrecoSugerido { get; set; }

    [MaxLength(500)]
    public string? Descricao { get; set; }

    // Chat, Estruturada, Painel
    [MaxLength(20)]
    public string Origem { get; set; } = "Painel";

    // Pendente, Aceita, Recusada
    [MaxLength(20)]
    public string Status { get; set; } = "Pendente";

    public DateTime DataCriacao { get; set; } = DateTime.UtcNow;
    public DateTime? DataResposta { get; set; }
}
