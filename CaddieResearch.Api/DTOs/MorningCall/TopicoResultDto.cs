namespace CaddieResearch.Api.DTOs.MorningCall;


/// <summary>
/// Tópico renderizado na leitura do Morning Call.
/// </summary>
public class TopicoResultDto
{
    /// <example>10</example>
    public int Id { get; set; }
    
    /// <example>Mercados Asiáticos fecham em alta</example>
    public string Titulo { get; set; } = string.Empty;
    
    /// <example>O índice Nikkei subiu 2% após balanços...</example>
    public string Texto { get; set; } = string.Empty;
    
    /// <example>https://bloomberg.com/news/123</example>
    public string? Link { get; set; }
    
    /// <example>https://meublob.core.windows.net/imagens/asia.jpg</example>
    public string? ImagemUrl { get; set; }
}