/// <summary>
/// Dados necessários para o gestor inserir um novo registro no histórico.
/// </summary>
public class CriarRegistroHistoricoDto
{
    /// <example>1</example>
    public int CarteiraId { get; set; }
    
    /// <example>PETR4</example>
    public string Ticker { get; set; } = string.Empty;
    
    /// <example>Petrobras</example>
    public string NomeAtivo { get; set; } = string.Empty;
    
    /// <example>Inclusão</example>
    public string Acao { get; set; } = string.Empty;
    
    /// <example>Compra</example>
    public string? Vies { get; set; }
    
    /// <example>45.50</example>
    public decimal PrecoAlvo { get; set; }
    
    /// <example>Inclusão justificada pela nova política de distribuição de proventos.</example>
    public string Justificativa { get; set; } = string.Empty;
}