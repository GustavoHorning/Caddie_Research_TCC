namespace CaddieResearch.Api.DTOs.Forum;
using System.ComponentModel.DataAnnotations;

public class ForumRecusaRequestDto
{
    [Required(ErrorMessage = "Informe o motivo da recusa.")]
    [StringLength(500, MinimumLength = 5, ErrorMessage = "O motivo deve ter entre 5 e 500 caracteres.")]
    public string Motivo { get; set; } = string.Empty;
}