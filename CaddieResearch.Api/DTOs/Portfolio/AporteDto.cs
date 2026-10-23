namespace CaddieResearch.Api.DTOs.Portfolio;

public class AporteDto
{
    /// <summary>
    /// Valor financeiro do aporte.
    /// </summary>
    /// <example>1500.00</example>
    public decimal Valor { get; set; }

    /// <summary>
    /// Descrição opcional (ex: Origem do dinheiro ou meta).
    /// </summary>
    /// <example>Aporte mensal (Outubro)</example>
    public string? Descricao { get; set; }

    /// <summary>
    /// Data em que o aporte foi efetivado.
    /// </summary>
    /// <example>2026-10-22T09:00:00Z</example>
    public DateTime? DataAporte { get; set; }
}