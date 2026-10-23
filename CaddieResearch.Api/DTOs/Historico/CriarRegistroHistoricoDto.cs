namespace CaddieResearch.Api.DTOs.Historico;

public class CriarRegistroHistoricoDto
{
    public int CarteiraId { get; set; }
    public string Ticker { get; set; } = string.Empty;
    public string NomeAtivo { get; set; } = string.Empty;
    public string Acao { get; set; } = string.Empty;
    public string? Vies { get; set; }
    public decimal PrecoAlvo { get; set; }
    public string Justificativa { get; set; } = string.Empty;
}