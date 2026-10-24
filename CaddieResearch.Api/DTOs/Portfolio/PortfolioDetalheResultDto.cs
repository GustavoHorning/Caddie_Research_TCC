using CaddieResearch.Api.DTOs.Portfolio;
namespace CaddieResearch.Api.DTOs.Portfolio;


public class PortfolioDetalheResultDto
{
    /// <example>1</example>
    public int Id { get; set; }
    /// <example>Minha Carteira de Aposentadoria</example>
    public string Nome { get; set; } = string.Empty;
    /// <example>2026-10-23T10:00:00Z</example>
    public DateTime DataInicio { get; set; }
    /// <example>João da Silva</example>
    public string? NomeCliente { get; set; }
    
    public List<PosicaoResultDto> Posicoes { get; set; } = new();
}