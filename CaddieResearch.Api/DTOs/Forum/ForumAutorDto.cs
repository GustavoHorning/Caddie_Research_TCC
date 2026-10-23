namespace CaddieResearch.Api.DTOs.Forum;
using System.ComponentModel.DataAnnotations;

public class ForumAutorDto
{
    public string Nome { get; set; } = string.Empty;
    public string TipoPerfil { get; set; } = string.Empty;
    public string? FotoPerfilUrl { get; set; }
}