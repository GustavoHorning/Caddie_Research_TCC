namespace CaddieResearch.Api.DTOs.Forum;

public class ForumTopicoDetalheResultDto : ForumTopicoResultDto
{
    public bool EhAutor { get; set; }
    public bool UsuarioEhGestor { get; set; }
    public List<ForumRespostaResultDto> Respostas { get; set; } = new();
}