namespace CaddieResearch.Api.DTOs.Relatorios;

public class RelatorioResultDto
{
    public int Id { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string Assunto { get; set; } = string.Empty;
    public string? ConteudoTexto { get; set; }
    public string? TagsAtivos { get; set; }
    public string? ArquivoPdfUrl { get; set; }
    public int CarteiraId { get; set; }
    public string NomeCarteira { get; set; } = string.Empty;
    public DateTime DataPublicacao { get; set; }
}