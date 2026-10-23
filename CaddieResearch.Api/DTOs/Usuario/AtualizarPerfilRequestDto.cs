using System.ComponentModel.DataAnnotations;

namespace CaddieResearch.Api.DTOs.Usuario;

public class AtualizarPerfilRequestDto
{
    [Required(ErrorMessage = "O nome é obrigatório.")]
    public string Nome { get; set; } = string.Empty;
}