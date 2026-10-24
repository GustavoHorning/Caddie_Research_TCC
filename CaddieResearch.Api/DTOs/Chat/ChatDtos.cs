namespace CaddieResearch.Api.DTOs.Chat;

/// <summary>
/// Dados para abrir uma nova conversa com o suporte/analistas.
/// </summary>
public class AbrirConversaDto
{
    /// <example>Dúvida sobre a Carteira de Dividendos</example>
    public string Assunto { get; set; } = string.Empty;
}

/// <summary>
/// Dados para enviar uma nova mensagem no chat.
/// </summary>
public class EnviarMensagemDto
{
    /// <example>Gostaria de saber por que PETR4 foi removida.</example>
    public string Conteudo { get; set; } = string.Empty;
}

/// <summary>
/// Representa uma mensagem renderizada no chat.
/// </summary>
public class MensagemResultDto
{
    /// <example>150</example>
    public int Id { get; set; }
    
    /// <example>Gostaria de saber por que PETR4 foi removida.</example>
    public string Conteudo { get; set; } = string.Empty;
    
    /// <example>false</example>
    public bool EhGestor { get; set; }
    
    /// <example>true</example>
    public bool Lida { get; set; }
    
    /// <example>2026-10-23T14:30:00Z</example>
    public DateTime DataEnvio { get; set; }
    
    /// <example>João da Silva</example>
    public string NomeRemetente { get; set; } = string.Empty;
}

/// <summary>
/// Representa o resumo de uma conversa para o cliente.
/// </summary>
public class ConversaResultDto
{
    /// <example>42</example>
    public int Id { get; set; }
    
    /// <example>Dúvida sobre a Carteira de Dividendos</example>
    public string Assunto { get; set; } = string.Empty;
    
    /// <example>Aberta</example>
    public string Status { get; set; } = string.Empty;
    
    /// <example>2026-10-23T10:00:00Z</example>
    public DateTime DataAbertura { get; set; }
    
    /// <example>5</example>
    public int TotalMensagens { get; set; }
}

/// <summary>
/// Representa o resumo de uma conversa na visão do Gestor.
/// </summary>
public class ConversaGestorResultDto : ConversaResultDto
{
    /// <example>João da Silva</example>
    public string NomeCliente { get; set; } = string.Empty;
    
    /// <example>joao.silva@email.com</example>
    public string EmailCliente { get; set; } = string.Empty;
    
    /// <example>2</example>
    public int NaoLidas { get; set; }
}