namespace CaddieResearch.Api.DTOs.Portfolio;

public class PosicaoResultDto
{
    public int Id { get; set; }
    public string Ticker { get; set; } = string.Empty;
    public string NomeAtivo { get; set; } = string.Empty;
    public string ClasseAtivo { get; set; } = string.Empty;
    public decimal Quantidade { get; set; }
    public decimal PrecoMedio { get; set; }
    public DateTime DataEntrada { get; set; }
    public decimal ValorTotal { get; set; }
}