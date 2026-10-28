namespace CaddieResearch.Api.DTOs.Forum;

/// <summary>
/// Resposta padrão contendo apenas uma mensagem de status.
/// </summary>
public class MensagemResponseDto
{
    /// <example>Operação realizada com sucesso.</example>
    public string Mensagem { get; set; } = string.Empty;
}

/// <summary>
/// Resultado da criação de um novo tópico.
/// </summary>
public class CriarTopicoResultDto
{
    /// <example>15</example>
    public int Id { get; set; }
    
    /// <example>Pendente</example>
    public string Status { get; set; } = string.Empty;
    
    /// <example>Tópico enviado para moderação.</example>
    public string Mensagem { get; set; } = string.Empty;
}

/// <summary>
/// Resultado da ação de curtir um tópico ou resposta.
/// </summary>
public class CurtirResultDto
{
    /// <example>true</example>
    public bool Curtido { get; set; }
    
    /// <example>42</example>
    public int Total { get; set; }
}

/// <summary>
/// Resposta ao enviar um comentário/resposta.
/// </summary>
public class ResponderResultDto
{
    /// <example>102</example>
    public int Id { get; set; }
}

/// <summary>
/// Estrutura para os chamados da área de moderação do Gestor.
/// </summary>
public class ChamadosDashboardResultDto
{
    public List<ForumTopicoResultDto> Chamados { get; set; } = new();
    
    /// <example>{"Pendente": 5, "Aprovado": 12, "Recusado": 2}</example>
    public Dictionary<string, int> Contagem { get; set; } = new();
}