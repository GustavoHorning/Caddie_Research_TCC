namespace CaddieResearch.Api.DTOs.Calendario;

/// <summary>
/// Dados para atualização de um evento existente criado pela Caddie.
/// </summary>
public class AtualizarEventoDto
{
    /// <example>Live de Fechamento (Nova Data)</example>
    public string Titulo { get; set; } = string.Empty;

    /// <example>A live foi adiada para as 19h devido a um imprevisto técnico.</example>
    public string? Descricao { get; set; }

    /// <example>2026-10-23T19:00:00Z</example>
    public DateTime DataHora { get; set; }

    /// <example>https://youtube.com/live/exemplo-atualizado</example>
    public string? LinkExterno { get; set; }
}