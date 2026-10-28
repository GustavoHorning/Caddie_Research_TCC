namespace CaddieResearch.Api.DTOs.Forum;
using System.ComponentModel.DataAnnotations;

public class ForumTopicoRequestDto
{
    [Required(ErrorMessage = "O título é obrigatório.")]
    [StringLength(150, MinimumLength = 5, ErrorMessage = "O título deve ter entre 5 e 150 caracteres.")]
    public string Titulo { get; set; } = string.Empty;

    [Required(ErrorMessage = "O conteúdo é obrigatório.")]
    [MinLength(10, ErrorMessage = "Escreva pelo menos 10 caracteres no conteúdo.")]
    public string Conteudo { get; set; } = string.Empty;

    [Required(ErrorMessage = "A categoria é obrigatória.")]
    public string Categoria { get; set; } = string.Empty;
}