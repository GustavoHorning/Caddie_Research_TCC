namespace CaddieResearch.Api.DTOs.Calendario;

/// <summary>
/// Dados necessários para criar um evento proprietário (Live, Reunião, Mentoria).
/// </summary>
public class CriarEventoCaddieDto
{
    /// <example>Live de Fechamento: Impacto dos Juros</example>
    public string Titulo { get; set; } = string.Empty;

    /// <example>2026-10-23T18:00:00Z</example>
    public DateTime DataHora { get; set; }

    /// <example>3</example>
    public int Impacto { get; set; }

    /// <example>Revisão geral do fechamento de mercado e projeções para o mês.</example>
    public string? Descricao { get; set; }

    /// <example>https://youtube.com/live/exemplo</example>
    public string? LinkExterno { get; set; }
}