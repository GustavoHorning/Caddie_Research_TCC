using System.ComponentModel.DataAnnotations;

namespace CaddieResearch.Api.DTOs.Auth;

/// <summary>
/// Credenciais para autenticação de usuário padrão.
/// </summary>
public class LoginRequest
{
    /// <example>joao.silva@email.com</example>
    [Required(ErrorMessage = "O e-mail é obrigatório.")]
    [EmailAddress(ErrorMessage = "O formato do e-mail é inválido.")]
    public string Email { get; set; } = string.Empty;

    /// <example>SenhaForte@2026!</example>
    [Required(ErrorMessage = "A senha é obrigatória.")]
    public string Senha { get; set; } = string.Empty;
}