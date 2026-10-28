namespace CaddieResearch.Api.DTOs.Indicadores;

/// <summary>
/// Representa as taxas macroeconômicas vigentes prontas para exibição.
/// </summary>
public class ResultadoTaxas
{
    /// <summary>
    /// Taxa básica de juros (Selic).
    /// </summary>
    /// <example>10,50%</example>
    public string Selic { get; set; } = "---";

    /// <summary>
    /// Certificado de Depósito Interbancário (CDI).
    /// </summary>
    /// <example>10,40%</example>
    public string Cdi { get; set; } = "---";
}