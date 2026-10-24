namespace CaddieResearch.Api.DTOs.Portfolio;

public class CriarPortfolioRequestDto
{
    /// <example>Minha Carteira de Aposentadoria</example>
    public string Nome { get; set; } = "Portfólio Inicial";
    
    /// <example>2026-10-23T10:00:00Z</example>
    public DateTime? DataInicio { get; set; }
    
    /// <example>10000.00</example>
    public decimal? AporteInicial { get; set; }
}