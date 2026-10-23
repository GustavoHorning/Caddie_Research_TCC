namespace CaddieResearch.Api.DTOs.Forum;

public class ForumRespostaResultDto
{
    public int Id { get; set; }
    public string Conteudo { get; set; } = string.Empty;
    public string? AudioUrl { get; set; }
    public DateTime DataCriacao { get; set; }
    public ForumAutorDto? Autor { get; set; }
    public int TotalCurtidas { get; set; }
    public bool CurtidoPorMim { get; set; }
    public bool PodeExcluir { get; set; }
    public List<object> Anexos { get; set; } = new();
}