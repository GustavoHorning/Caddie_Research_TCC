namespace CaddieResearch.Api.DTOs.Internacional;

/// <summary>
/// Representa a cotação consolidada de um ativo internacional com conversão para BRL.
/// </summary>
public class InternacionalResponse
{
    /// <example>AAPL</example>
    public string Symbol { get; set; } = string.Empty;
    
    /// <example>Apple Inc.</example>
    public string ShortName { get; set; } = string.Empty; 
    
    /// <example>https://finnhub.io/api/logo?symbol=AAPL</example>
    public string LogoUrl { get; set; } = string.Empty;   
    
    /// <example>175.50</example>
    public decimal PriceUsd { get; set; }
    
    /// <example>1.25</example>
    public decimal ChangePercent { get; set; }
    
    /// <example>5.10</example>
    public decimal ExchangeRate { get; set; } 
    
    /// <example>895.05</example>
    public decimal PriceBrl { get; set; }  
}

/// <summary>
/// DTO de erro padrão para falhas na busca de ativos internacionais.
/// </summary>
public class InternacionalErrorResponse
{
    /// <example>Não foi possível encontrar dados para o ativo internacional AAPL.</example>
    public string Mensagem { get; set; } = string.Empty;
}