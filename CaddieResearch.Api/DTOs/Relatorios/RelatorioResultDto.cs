namespace CaddieResearch.Api.DTOs.Relatorios;

public class RelatorioResultDto
{
    /// <example>42</example>
    public int Id { get; set; }
    
    /// <example>Análise 3T26 de WEGE3</example>
    public string Titulo { get; set; } = string.Empty;
    
    /// <example>Resultado trimestral e perspectivas futuras.</example>
    public string Assunto { get; set; } = string.Empty;
    
    public string? ConteudoTexto { get; set; }
    
    /// <example>WEGE3, ELET3</example>
    public string? TagsAtivos { get; set; }
    
    /// <example>https://meublob.core.windows.net/pdfs/rel_42.pdf</example>
    public string? ArquivoPdfUrl { get; set; }
    
    /// <example>1</example>
    public int CarteiraId { get; set; }
    
    /// <example>Carteira de Ações</example>
    public string NomeCarteira { get; set; } = string.Empty;
    
    /// <example>2026-10-23T10:00:00Z</example>
    public DateTime DataPublicacao { get; set; }
}

public class RelatorioResponseDto
{
    /// <example>Operação realizada com sucesso.</example>
    public string Mensagem { get; set; } = string.Empty;
}

public class RelatorioRevisadoDto
{
    /// <example>true</example>
    public bool Revisado { get; set; }
}

public class DownloadErrorDto
{
    /// <example>Acesso Negado</example>
    public string Erro { get; set; } = string.Empty;
    
    /// <example>Seu plano atual não permite acessar os relatórios da carteira Black.</example>
    public string Mensagem { get; set; } = string.Empty;
}