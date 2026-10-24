namespace CaddieResearch.Api.DTOs.Portfolio;


public class PosicaoResultDto
{
    /// <example>10</example>
    public int Id { get; set; }
    /// <example>PETR4</example>
    public string Ticker { get; set; } = string.Empty;
    /// <example>Petrobras</example>
    public string NomeAtivo { get; set; } = string.Empty;
    
    // CORREÇÃO: Propriedade que estava faltando e quebrando o mapeamento
    /// <example>Renda Variável</example>
    public string ClasseAtivo { get; set; } = string.Empty;
    
    /// <example>100</example>
    public decimal Quantidade { get; set; }
    /// <example>35.50</example>
    public decimal PrecoMedio { get; set; }
    /// <example>2026-10-23T10:00:00Z</example>
    public DateTime DataEntrada { get; set; }
    /// <example>3550.00</example>
    public decimal ValorTotal { get; set; }
}