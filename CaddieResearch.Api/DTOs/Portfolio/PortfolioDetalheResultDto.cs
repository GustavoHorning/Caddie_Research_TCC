namespace CaddieResearch.Api.DTOs.Portfolio;

public class PortfolioDetalheResultDto
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public DateTime DataInicio { get; set; }
    public string? NomeCliente { get; set; }
    public List<PosicaoResultDto> Posicoes { get; set; } = new();
}