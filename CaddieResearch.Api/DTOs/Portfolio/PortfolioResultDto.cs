namespace CaddieResearch.Api.DTOs.Portfolio;

public class PortfolioResultDto
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public DateTime DataInicio { get; set; }
    public decimal Patrimonio { get; set; }
    public int TotalPosicoes { get; set; }
    public bool TemContaCorrente { get; set; }
    public decimal TotalAportes { get; set; }
}