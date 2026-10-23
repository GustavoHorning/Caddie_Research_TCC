namespace CaddieResearch.Api.DTOs.Recomendacoes;

public class RecomendacaoRequestDto
{
    public int ClienteId { get; set; }
    public string Ticker { get; set; } = string.Empty;
    public string NomeAtivo { get; set; } = string.Empty;
    public string ClasseAtivo { get; set; } = "Renda Variável";
    public decimal Quantidade { get; set; }
    public decimal PrecoSugerido { get; set; }
    public string? Descricao { get; set; }
    public string? Origem { get; set; }
}