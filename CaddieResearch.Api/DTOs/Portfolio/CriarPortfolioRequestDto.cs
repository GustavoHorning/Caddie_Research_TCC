namespace CaddieResearch.Api.DTOs.Portfolio;

public class CriarPortfolioRequestDto
{
    public string Nome { get; set; } = "Portfólio Inicial";
    public DateTime? DataInicio { get; set; }
    public decimal? AporteInicial { get; set; }
}