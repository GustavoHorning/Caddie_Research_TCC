using System.ComponentModel.DataAnnotations;

namespace CaddieResearch.Api.DTOs.Auth;

public class CadastrarUsuarioRequest
{
    [Required(ErrorMessage = "O nome é obrigatório.")]
    [MinLength(3, ErrorMessage = "O nome deve ter no mínimo 3 caracteres.")]
    [MaxLength(100, ErrorMessage = "O nome excedeu o limite de 100 caracteres.")]
    public string Nome { get; set; } = string.Empty;

    [Required(ErrorMessage = "O e-mail é obrigatório.")]
    [EmailAddress(ErrorMessage = "O formato do e-mail é inválido.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "A senha é obrigatória.")]
    [MinLength(8, ErrorMessage = "A senha deve ter no mínimo 8 caracteres.")]
    [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$", 
        ErrorMessage = "A senha deve conter pelo menos 8 caracteres, uma letra maiúscula, uma minúscula, um número e um caractere especial.")]
    public string Senha { get; set; } = string.Empty;
}