namespace CaddieResearch.Api.DTOs.Calendario;

public class AtualizarEventoDto
{
    public string Titulo { get; set; } = string.Empty;
    public string Descricao { get; set; } = string.Empty;
    public DateTime DataHora { get; set; }
    public string LinkExterno { get; set; } = string.Empty;
}