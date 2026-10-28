
/// <summary>
/// Timeline histórica de um ativo, agrupando suas recomendações e relatórios.
/// </summary>
public class HistoricoAtivoAgrupadoDto
{
    /// <example>PETR4</example>
    public string Ticker { get; set; } = string.Empty;
    
    /// <example>Petrobras</example>
    public string NomeAtivo { get; set; } = string.Empty;
    
    /// <example>false</example>
    public bool Bloqueado { get; set; }
    
    /// <example>1</example>
    public int NivelExigido { get; set; }
    
    /// <example>Premium</example>
    public string PlanoMinimo { get; set; } = string.Empty;
    
    public List<LogHistoricoDto> Logs { get; set; } = new();
    public List<RelatorioRelacionadoDto> RelatoriosRelacionados { get; set; } = new();
}