public class RelatorioRelacionadoDto
{
    /// <example>50</example>
    public int Id { get; set; }
    
    /// <example>Balanço 3T26 Petrobras</example>
    public string Titulo { get; set; } = string.Empty;
    
    /// <example>Análise completa do resultado trimestral.</example>
    public string Assunto { get; set; } = string.Empty;
    
    /// <example>2026-10-23T10:00:00Z</example>
    public DateTime DataPublicacao { get; set; }
    
    /// <example>Carteira de Ações</example>
    public string NomeCarteira { get; set; } = string.Empty;
    
    /// <example>false</example>
    public bool Bloqueado { get; set; }
    
    /// <example>Premium</example>
    public string PlanoMinimo { get; set; } = string.Empty;
}