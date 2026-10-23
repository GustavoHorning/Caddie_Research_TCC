namespace CaddieResearch.Api.DTOs.Calendario;

public class EventoResultDto
{
    public int Id { get; set; }
    public string DataStr { get; set; } = string.Empty;
    public string Hora { get; set; } = string.Empty;
    public string Titulo { get; set; } = string.Empty;
    public string Tipo { get; set; } = string.Empty;
    public int Impacto { get; set; }
    public string? Projecao { get; set; }
    public string? Atual { get; set; }
    public string? Ticker { get; set; }
    public string? Pais { get; set; }
    public string? Descricao { get; set; }
    public string? Link { get; set; }
}