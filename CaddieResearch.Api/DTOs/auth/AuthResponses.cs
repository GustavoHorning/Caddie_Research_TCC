namespace CaddieResearch.Api.DTOs.Auth;

/// <summary>
/// Representa o resultado de uma operação genérica do sistema de autenticação (sucesso ou erro).
/// </summary>
public class AuthResultDto
{
    /// <summary>
    /// Mensagem descrevendo o resultado da operação.
    /// </summary>
    /// <example>Operação realizada com sucesso.</example>
    public string Mensagem { get; set; } = string.Empty;
}

/// <summary>
/// Representa os dados devolvidos após um login bem-sucedido.
/// </summary>
public class LoginResultDto
{
    /// <summary>
    /// Mensagem de boas-vindas ou status.
    /// </summary>
    /// <example>Login realizado com sucesso!</example>
    public string Mensagem { get; set; } = string.Empty;

    /// <summary>
    /// Token JWT para autenticação nas rotas protegidas.
    /// </summary>
    /// <example>eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c</example>
    public string Token { get; set; } = string.Empty;

    /// <summary>
    /// Resumo dos dados do usuário logado.
    /// </summary>
    public UsuarioLogadoDto? Usuario { get; set; }
}

/// <summary>
/// Dados básicos do usuário retornados no momento do login.
/// </summary>
public class UsuarioLogadoDto
{
    /// <example>42</example>
    public int Id { get; set; }
    
    /// <example>João da Silva</example>
    public string Nome { get; set; } = string.Empty;
    
    /// <example>joao.silva@email.com</example>
    public string Email { get; set; } = string.Empty;
}