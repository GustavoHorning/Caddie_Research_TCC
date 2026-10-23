namespace CaddieResearch.Api.DTOs.Historico;

public class LogHistoricoDto
{
    public int Id { get; set; }
    public string Acao { get; set; } = string.Empty;
    public string? Vies { get; set; }
    public decimal PrecoAlvo { get; set; }
    public string Justificativa { get; set; } = string.Empty;
    public DateTime DataRecomendacao { get; set; }
    public string NomeGestor { get; set; } = string.Empty;
    public string? NomeCarteira { get; set; }
    public bool Bloqueado { get; set; }
    public string PlanoMinimo { get; set; } = string.Empty;
}