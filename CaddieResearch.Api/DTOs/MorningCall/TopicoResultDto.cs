namespace CaddieResearch.Api.DTOs.MorningCall;

public class TopicoResultDto
{
    public int Id { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string Texto { get; set; } = string.Empty;
    public string? Link { get; set; }
    public string? ImagemUrl { get; set; }
}