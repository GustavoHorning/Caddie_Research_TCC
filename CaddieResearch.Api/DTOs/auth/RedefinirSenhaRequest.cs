using System.ComponentModel.DataAnnotations;

namespace CaddieResearch.Api.DTOs.Auth;

/// <summary>
/// Dados para efetivar a troca de senha utilizando o código recebido.
/// </summary>
public class RedefinirSenhaRequest
{
    /// <example>joao.silva@email.com</example>
    [Required(ErrorMessage = "O e-mail é obrigatório.")]
    public string Email { get; set; } = string.Empty;

    /// <example>123456</example>
    [Required(ErrorMessage = "O código é obrigatório.")]
    public string Token { get; set; } = string.Empty; 

    /// <example>NovaSenha@2027!</example>
    [Required(ErrorMessage = "A nova senha é obrigatória.")]
    [MinLength(8, ErrorMessage = "A senha deve ter no mínimo 8 caracteres.")]
    [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$", 
        ErrorMessage = "A senha deve conter pelo menos 8 caracteres, uma letra maiúscula, uma minúscula, um número e um caractere especial.")]
    public string NovaSenha { get; set; } = string.Empty;
}