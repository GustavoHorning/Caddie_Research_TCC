namespace CaddieResearch.Api.DTOs.MorningCall;


/// <summary>
/// Estrutura para envio de um tópico dentro do Morning Call.
/// </summary>
public class TopicoInputDto
{
    public int? Id { get; set; }
    
    /// <example>Mercados Asiáticos fecham em alta</example>
    public string Titulo { get; set; } = string.Empty;
    
    /// <example>O índice Nikkei subiu 2% após balanços positivos de tecnologia.</example>
    public string Texto { get; set; } = string.Empty;
    
    /// <example>https://bloomberg.com/news/123</example>
    public string? Link { get; set; }
    
    public string? ImagemUrlExistente { get; set; }
}