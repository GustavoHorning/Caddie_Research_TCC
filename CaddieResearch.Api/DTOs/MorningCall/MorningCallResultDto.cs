namespace CaddieResearch.Api.DTOs.MorningCall;

public class MorningCallResultDto
{
    public int Id { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public DateTime Data { get; set; }
    public DateTime DataCriacao { get; set; }
    public string? AudioUrl { get; set; }
    public string? NomeGestor { get; set; }
    public List<TopicoResultDto> Topicos { get; set; } = new();
}