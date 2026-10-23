namespace CaddieResearch.Api.DTOs.Recomendacoes;

public class RecomendacaoResultDto
{
    public int Id { get; set; }
    public string Ticker { get; set; } = string.Empty;
    public string NomeAtivo { get; set; } = string.Empty;
    public string ClasseAtivo { get; set; } = string.Empty;
    public decimal Quantidade { get; set; }
    public decimal PrecoSugerido { get; set; }
    public string? Descricao { get; set; }
    public string? Origem { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime DataCriacao { get; set; }
    public DateTime? DataResposta { get; set; }
    public int? PortfolioId { get; set; }
    public string? NomeGestor { get; set; }
    public string? NomeCliente { get; set; }
}