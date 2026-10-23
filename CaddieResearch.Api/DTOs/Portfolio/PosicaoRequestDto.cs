namespace CaddieResearch.Api.DTOs.Portfolio;

public class PosicaoRequestDto
{
    public string Ticker { get; set; } = string.Empty;
    public string NomeAtivo { get; set; } = string.Empty;
    public string ClasseAtivo { get; set; } = "Renda Variável";
    public decimal Quantidade { get; set; }
    public decimal PrecoMedio { get; set; }
    public DateTime? DataEntrada { get; set; }
}