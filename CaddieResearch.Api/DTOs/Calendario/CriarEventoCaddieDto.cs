namespace CaddieResearch.Api.DTOs.Calendario;

public class CriarEventoCaddieDto
{
    public string Titulo { get; set; } = string.Empty;
    public DateTime DataHora { get; set; }
    public string Descricao { get; set; } = string.Empty;
    public string LinkExterno { get; set; } = string.Empty;
    public int Impacto { get; set; }
}