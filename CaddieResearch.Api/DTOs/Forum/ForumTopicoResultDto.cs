namespace CaddieResearch.Api.DTOs.Forum;

public class ForumTopicoResultDto
{
    public int Id { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string? Conteudo { get; set; }
    public string Categoria { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? MotivoRecusa { get; set; }
    public DateTime Data { get; set; }
    public ForumAutorDto? Autor { get; set; }
    public int TotalCurtidas { get; set; }
    public int TotalRespostas { get; set; }
    public bool CurtidoPorMim { get; set; }
}