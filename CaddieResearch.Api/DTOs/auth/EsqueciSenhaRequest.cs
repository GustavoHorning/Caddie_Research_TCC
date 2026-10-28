namespace CaddieResearch.Api.DTOs.Auth;

/// <summary>
/// Requisição para envio do código de recuperação de senha.
/// </summary>
public class EsqueciSenhaRequest
{
    /// <example>joao.silva@email.com</example>
    public string Email { get; set; } = string.Empty;
}