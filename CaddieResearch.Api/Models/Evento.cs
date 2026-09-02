using System.ComponentModel.DataAnnotations;

namespace CaddieResearch.Api.Models;

public class Evento
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Titulo { get; set; } = string.Empty;

    [Required]
    public DateTime DataHora { get; set; }

    [Required]
    [MaxLength(20)]
    public string Tipo { get; set; } = "Macro";

    public int Impacto { get; set; } = 1;

    [MaxLength(20)]
    public string? Projecao { get; set; }

    [MaxLength(20)]
    public string? Atual { get; set; }

    [MaxLength(20)]
    public string? TickerRelacionado { get; set; }

    [MaxLength(5)]
    public string Pais { get; set; } = "BR";

    [MaxLength(1000)]
    public string? Descricao { get; set; }

    [MaxLength(255)]
    public string? LinkExterno { get; set; }

    public DateTime DataCriacao { get; set; } = DateTime.UtcNow;
}