namespace CaddieResearch.Api.DTOs.Portfolio;


public class PortfolioResultDto
{
    /// <example>1</example>
    public int Id { get; set; }
    /// <example>Minha Carteira de Aposentadoria</example>
    public string Nome { get; set; } = string.Empty;
    /// <example>2026-10-23T10:00:00Z</example>
    public DateTime DataInicio { get; set; }
    /// <example>15450.50</example>
    public decimal Patrimonio { get; set; }
    /// <example>5</example>
    public int TotalPosicoes { get; set; }
    /// <example>true</example>
    public bool TemContaCorrente { get; set; }
    /// <example>10000.00</example>
    public decimal TotalAportes { get; set; }
}