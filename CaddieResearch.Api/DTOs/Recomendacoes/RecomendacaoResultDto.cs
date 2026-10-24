public class RecomendacaoResultDto
{
    /// <example>10</example>
    public int Id { get; set; }
    /// <example>WEGE3</example>
    public string Ticker { get; set; } = string.Empty;
    /// <example>WEG S.A.</example>
    public string NomeAtivo { get; set; } = string.Empty;
    /// <example>Renda Variável</example>
    public string ClasseAtivo { get; set; } = string.Empty;
    /// <example>100</example>
    public decimal Quantidade { get; set; }
    /// <example>38.50</example>
    public decimal PrecoSugerido { get; set; }
    /// <example>Empresa excelente...</example>
    public string? Descricao { get; set; }
    /// <example>Painel Gestor</example>
    public string? Origem { get; set; }
    /// <example>Pendente</example>
    public string Status { get; set; } = string.Empty;
    /// <example>2026-10-23T10:00:00Z</example>
    public DateTime DataCriacao { get; set; }
    public DateTime? DataResposta { get; set; }
    public int? PortfolioId { get; set; }
    /// <example>Gestor Caddie</example>
    public string? NomeGestor { get; set; }
    /// <example>João da Silva</example>
    public string? NomeCliente { get; set; }
}