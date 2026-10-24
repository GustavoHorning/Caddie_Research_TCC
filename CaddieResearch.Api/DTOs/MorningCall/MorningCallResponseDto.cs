namespace CaddieResearch.Api.DTOs.MorningCall;

/// <summary>
/// Resposta padrão para operações de Morning Call.
/// </summary>
public class MorningCallResponseDto
{
    /// <example>Operação realizada com sucesso.</example>
    public string Mensagem { get; set; } = string.Empty;
    
    /// <example>42</example>
    public int? Id { get; set; }
}