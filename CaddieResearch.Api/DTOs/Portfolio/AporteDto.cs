namespace CaddieResearch.Api.DTOs.Portfolio;

/// <summary>
/// Representa os dados enviados para cadastrar um novo aporte financeiro.
/// </summary>
public class AporteRequestDto
{
    /// <summary>
    /// Valor financeiro do aporte em reais (R$).
    /// </summary>
    /// <example>1500.50</example>
    public decimal Valor { get; set; }

    /// <summary>
    /// Descrição opcional para identificar a origem ou motivo do aporte.
    /// </summary>
    /// <example>Aporte mensal de outubro</example>
    public string? Descricao { get; set; }

    /// <summary>
    /// Data em que o aporte foi efetivamente realizado. Se omitido, assume a data atual.
    /// </summary>
    /// <example>2026-10-23T10:00:00Z</example>
    public DateTime? DataAporte { get; set; }
}

/// <summary>
/// Representa o resultado de um aporte já registrado no sistema.
/// </summary>
public class AporteResultDto
{
    /// <example>1</example>
    public int Id { get; set; }
    
    /// <example>42</example>
    public int PortfolioId { get; set; }
    
    /// <example>1500.50</example>
    public decimal Valor { get; set; }
    
    /// <example>Aporte mensal de outubro</example>
    public string? Descricao { get; set; }
    
    /// <example>2026-10-23T10:00:00Z</example>
    public DateTime DataAporte { get; set; }
    
    /// <example>2026-10-23T10:05:00Z</example>
    public DateTime DataRegistro { get; set; }
}