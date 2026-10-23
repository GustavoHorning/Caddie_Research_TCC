namespace CaddieResearch.Api.DTOs.Busca;

public class BuscaGlobalResultDto
{
    public string Id { get; set; } = string.Empty;
    public int RealId { get; set; }
    public string Tipo { get; set; } = string.Empty;
    public string Titulo { get; set; } = string.Empty;
    public string[] Tags { get; set; } = Array.Empty<string>();
    public DateTime? DataPublicacao { get; set; }
    public string? ArquivoPdfUrl { get; set; }
    public string Url { get; set; } = string.Empty;
    public int? CarteiraId { get; set; }
    public int NivelExigido { get; set; }
}