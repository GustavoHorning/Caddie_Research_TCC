using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CaddieResearch.Api.Models;

public class Posicao
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int PortfolioId { get; set; }

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

    public decimal PrecoMedio { get; set; }

    public DateTime DataEntrada { get; set; } = DateTime.UtcNow;
}
