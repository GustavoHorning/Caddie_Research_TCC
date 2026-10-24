public class RecomendacaoRequestDto
{
    /// <example>42</example>
    public int ClienteId { get; set; }
    
    /// <example>WEGE3</example>
    public string Ticker { get; set; } = string.Empty;
    
    /// <example>WEG S.A.</example>
    public string NomeAtivo { get; set; } = string.Empty;
    
    /// <example>Renda Variável</example>
    public string ClasseAtivo { get; set; } = "Renda Variável";
    
    /// <example>100</example>
    public decimal Quantidade { get; set; }
    
    /// <example>38.50</example>
    public decimal PrecoSugerido { get; set; }
    
    /// <example>Empresa excelente para composição de carteira a longo prazo.</example>
    public string? Descricao { get; set; }
    
    /// <example>Painel Gestor</example>
    public string? Origem { get; set; }
}