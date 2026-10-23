namespace CaddieResearch.Api.DTOs.Historico;

public class HistoricoAtivoAgrupadoDto
{
    public string Ticker { get; set; } = string.Empty;
    public string NomeAtivo { get; set; } = string.Empty;
    public bool Bloqueado { get; set; }
    public int NivelExigido { get; set; }
    public string PlanoMinimo { get; set; } = string.Empty;
    public List<LogHistoricoDto> Logs { get; set; } = new();
    public List<RelatorioRelacionadoDto> RelatoriosRelacionados { get; set; } = new();
}