using System.Text.Json.Serialization;

namespace CaddieResearch.Api.DTOs.Acoes;

public class CotacaoResultDto
{
    [JsonPropertyName("symbol")]
    public string Symbol { get; set; } = string.Empty;
    
    [JsonPropertyName("shortName")]
    public string ShortName { get; set; } = string.Empty;
    
    [JsonPropertyName("logourl")]
    public string LogoUrl { get; set; } = string.Empty;
    
    [JsonPropertyName("regularMarketPrice")]
    public double RegularMarketPrice { get; set; }
    
    [JsonPropertyName("regularMarketChangePercent")]
    public double RegularMarketChangePercent { get; set; }
}