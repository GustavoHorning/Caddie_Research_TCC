namespace CaddieResearch.Api.DTOs.Notificacoes;

/// <summary>
/// Dados necessários para disparar uma notificação manual no sistema.
/// </summary>
public class DispararNotificacaoDto
{
    /// <example>Manutenção Programada</example>
    public string Titulo { get; set; } = string.Empty;
    
    /// <example>O sistema ficará instável das 02h às 04h para atualização.</example>
    public string Mensagem { get; set; } = string.Empty;
    
    /// <example>Info</example>
    public string Tipo { get; set; } = "Info";
    
    /// <example>/dashboard</example>
    public string? LinkDestino { get; set; }
}

/// <summary>
/// Representa uma notificação na central do usuário.
/// </summary>
public class NotificacaoResultDto
{
    /// <example>150</example>
    public int Id { get; set; }
    
    /// <example>Novo Relatório Disponível</example>
    public string Titulo { get; set; } = string.Empty;
    
    /// <example>Confira a análise do 3T26 de PETR4.</example>
    public string Mensagem { get; set; } = string.Empty;
    
    /// <example>Conteudo</example>
    public string Tipo { get; set; } = string.Empty;
    
    /// <example>/relatorios/5</example>
    public string? LinkDestino { get; set; }
    
    /// <example>false</example>
    public bool Lida { get; set; }
    
    /// <example>2026-10-23T15:30:00Z</example>
    public DateTime DataCriacao { get; set; }
}

/// <summary>
/// Resposta padrão para operações de notificação.
/// </summary>
public class NotificacaoResponseDto
{
    /// <example>Notificação disparada com sucesso e salva no banco!</example>
    public string Mensagem { get; set; } = string.Empty;
}