using System.ComponentModel.DataAnnotations;

namespace CaddieResearch.Api.DTOs.Usuario;

public class AtualizarPerfilRequestDto
{
    [Required(ErrorMessage = "O nome é obrigatório.")]
    /// <example>João da Silva</example>
    public string Nome { get; set; } = string.Empty;
}

public class AlterarSenhaRequestDto
{
    [Required(ErrorMessage = "A senha atual é obrigatória.")]
    /// <example>SenhaVelha@123</example>
    public string SenhaAtual { get; set; } = string.Empty;

    [Required(ErrorMessage = "A nova senha é obrigatória.")]
    [MinLength(8, ErrorMessage = "A senha deve ter no mínimo 8 caracteres.")]
    [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$", 
        ErrorMessage = "A senha deve conter pelo menos 8 caracteres, uma letra maiúscula, uma minúscula, um número e um caractere especial.")]
    /// <example>SenhaNova#456</example>
    public string NovaSenha { get; set; } = string.Empty;
}

public class UsuarioPerfilResultDto
{
    /// <example>João da Silva</example>
    public string Nome { get; set; } = string.Empty;
    
    /// <example>joao@email.com</example>
    public string Email { get; set; } = string.Empty;
    
    /// <example>Assinante</example>
    public string TipoPerfil { get; set; } = string.Empty;
    
    /// <example>Premium</example>
    public string? Plano { get; set; }
    
    /// <example>false</example>
    public bool EhSocial { get; set; }
    
    /// <example>https://meublob.core.windows.net/imagens/perfil.jpg</example>
    public string? FotoPerfilUrl { get; set; }
    
    /// <example>23/11/2026</example>
    public string? DataVencimento { get; set; }
}

/// <summary>
/// Resposta padrão para operações de perfil, incluindo a URL em caso de upload de foto.
/// </summary>
public class UsuarioResponseDto
{
    /// <example>Operação realizada com sucesso.</example>
    public string Mensagem { get; set; } = string.Empty;
    
    /// <example>https://meublob.core.windows.net/imagens/perfil.jpg</example>
    public string? Url { get; set; }
}