namespace CaddieResearch.Api.DTOs.MorningCall;


/// <summary>
/// O Morning Call completo retornado para o usuário.
/// </summary>
public class MorningCallResultDto
{
    /// <example>42</example>
    public int Id { get; set; }
    
    /// <example>Morning Call - 23 de Outubro</example>
    public string Titulo { get; set; } = string.Empty;
    
    /// <example>2026-10-23T08:00:00Z</example>
    public DateTime Data { get; set; }
    
    /// <example>2026-10-23T07:45:00Z</example>
    public DateTime DataCriacao { get; set; }
    
    /// <example>https://meublob.core.windows.net/audios/mc_out.mp3</example>
    public string? AudioUrl { get; set; }
    
    /// <example>João da Silva</example>
    public string? NomeGestor { get; set; }
    
    public List<TopicoResultDto> Topicos { get; set; } = new();
}