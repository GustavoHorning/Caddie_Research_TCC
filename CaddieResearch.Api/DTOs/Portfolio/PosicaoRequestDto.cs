namespace CaddieResearch.Api.DTOs.Portfolio;


public class PosicaoRequestDto
{
    /// <example>PETR4</example>
    public string Ticker { get; set; } = string.Empty;
    /// <example>Petrobras</example>
    public string NomeAtivo { get; set; } = string.Empty;
    /// <example>Renda Variável</example>
    public string ClasseAtivo { get; set; } = "Renda Variável";
    /// <example>100</example>
    public decimal Quantidade { get; set; }
    /// <example>35.50</example>
    public decimal PrecoMedio { get; set; }
    /// <example>2026-10-23T10:00:00Z</example>
    public DateTime? DataEntrada { get; set; }
}