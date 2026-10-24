namespace CaddieResearch.Api.DTOs.Calendario;

/// <summary>
/// Representa um evento renderizado no calendário (Macro, Balanço ou Caddie).
/// </summary>
public class EventoResultDto
{
    /// <example>42</example>
    public int Id { get; set; }

    /// <example>2026-10-23</example>
    public string DataStr { get; set; } = string.Empty;

    /// <example>18:00</example>
    public string Hora { get; set; } = string.Empty;

    /// <example>Live de Fechamento</example>
    public string Titulo { get; set; } = string.Empty;

    /// <example>Caddie</example>
    public string Tipo { get; set; } = string.Empty;

    /// <example>3</example>
    public int Impacto { get; set; }

    /// <example>10.5%</example>
    public string? Projecao { get; set; }

    /// <example>10.7%</example>
    public string? Atual { get; set; }

    /// <example>PETR4</example>
    public string? Ticker { get; set; }

    /// <example>BR</example>
    public string? Pais { get; set; }

    /// <example>Revisão de resultados trimestrais.</example>
    public string? Descricao { get; set; }

    /// <example>https://youtube.com</example>
    public string? Link { get; set; }
}