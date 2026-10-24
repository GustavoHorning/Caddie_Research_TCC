namespace CaddieResearch.Api.DTOs.Mercado;

/// <summary>
/// Exemplo da estrutura de resposta retornada pelo proxy do Yahoo Finance.
/// </summary>
public class YahooChartResponseDto
{
    public YahooChartDto Chart { get; set; } = new();
}

public class YahooChartDto
{
    public object[] Result { get; set; } = Array.Empty<object>();
    public object? Error { get; set; }
}

/// <summary>
/// Exemplo da estrutura de resposta retornada pelo proxy da B3.
/// </summary>
public class B3FuturoResponseDto
{
    public object? TradgFlr { get; set; }
}

/// <summary>
/// Representa a resposta da série histórica do CDI pelo Banco Central (BCB).
/// </summary>
public class CdiBcbDto
{
    /// <example>23/10/2026</example>
    public string Data { get; set; } = string.Empty;

    /// <example>10.50</example>
    public string Valor { get; set; } = string.Empty;
}

/// <summary>
/// Padronização de erros para as falhas de proxy de mercado.
/// </summary>
public class MercadoErrorDto
{
    /// <example>Falha ao buscar dados no provedor externo.</example>
    public string Erro { get; set; } = string.Empty;
    
    /// <example>The remote server returned an error: (404) Not Found.</example>
    public string? Detalhe { get; set; }
}