namespace CaddieResearch.Api.DTOs.Internacional;

public class InternacionalResponse
{
    public string Symbol { get; set; } = string.Empty;
    public string ShortName { get; set; } = string.Empty; 
    public string LogoUrl { get; set; } = string.Empty;   
    public decimal PriceUsd { get; set; }
    public decimal ChangePercent { get; set; }
    public decimal ExchangeRate { get; set; } 
    public decimal PriceBrl { get; set; }  
}