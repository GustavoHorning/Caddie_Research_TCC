public class LogHistoricoDto
{
    /// <example>102</example>
    public int Id { get; set; }
    
    /// <example>Alteração de Preço Alvo</example>
    public string Acao { get; set; } = string.Empty;
    
    /// <example>Manter</example>
    public string? Vies { get; set; }
    
    /// <example>45.50</example>
    public decimal PrecoAlvo { get; set; }
    
    /// <example>Ajuste no preço teto devido a fatores macroeconômicos.</example>
    public string Justificativa { get; set; } = string.Empty;
    
    /// <example>2026-10-23T14:00:00Z</example>
    public DateTime DataRecomendacao { get; set; }
    
    /// <example>João da Silva</example>
    public string NomeGestor { get; set; } = string.Empty;
    
    /// <example>Carteira de Ações</example>
    public string? NomeCarteira { get; set; }
    
    /// <example>false</example>
    public bool Bloqueado { get; set; }
    
    /// <example>Premium</example>
    public string PlanoMinimo { get; set; } = string.Empty;
}