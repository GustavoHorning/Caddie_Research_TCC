using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CaddieResearch.Api.Models;

public class Aporte
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int PortfolioId { get; set; }

    [ForeignKey("PortfolioId")]
    public Portfolio? Portfolio { get; set; }

    [Required]
    public decimal Valor { get; set; }

    [MaxLength(200)]
    public string? Descricao { get; set; }

    public DateTime DataAporte { get; set; } = DateTime.UtcNow;

    public DateTime DataRegistro { get; set; } = DateTime.UtcNow;
}
