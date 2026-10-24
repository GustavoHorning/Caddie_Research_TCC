using Microsoft.AspNetCore.Mvc;
using CaddieResearch.Api.DTOs.Auth;
using CaddieResearch.Api.Interfaces;

namespace CaddieResearch.Api.Controllers;

/// <summary>
/// Gerencia a autenticação, registro e recuperação de senhas dos usuários.
/// </summary>
[Route("api/[controller]")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    /// <summary>
    /// Cadastra um novo usuário no sistema.
    /// </summary>
    /// <remarks>
    /// Cria a conta, gera o portfólio inicial vazio e envia o e-mail de confirmação obrigatória.
    /// </remarks>
    /// <response code="201">Conta criada. O usuário deve verificar o e-mail.</response>
    /// <response code="400">E-mail já está em uso.</response>
    [HttpPost("cadastrar")]
    [ProducesResponseType(typeof(AuthResultDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Cadastrar([FromBody] CadastrarUsuarioRequest request)
    {
        var (sucesso, mensagem) = await _authService.CadastrarAsync(request);
        if (!sucesso) return BadRequest(new AuthResultDto { Mensagem = mensagem });
        return Created("", new AuthResultDto { Mensagem = mensagem });
    }
    
    /// <summary>
    /// Confirma o endereço de e-mail de um novo usuário.
    /// </summary>
    /// <remarks>
    /// Valida o token recebido no link do e-mail, liberando o acesso do usuário à plataforma.
    /// </remarks>
    /// <response code="200">E-mail confirmado com sucesso.</response>
    /// <response code="400">E-mail já confirmado anteriormente.</response>
    /// <response code="401">Token inválido ou expirado.</response>
    /// <response code="404">Usuário não encontrado.</response>
    [HttpGet("confirmar-email")]
    [ProducesResponseType(typeof(AuthResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ConfirmarEmail([FromQuery] string email, [FromQuery] string token)
    {
        var (sucesso, mensagem) = await _authService.ConfirmarEmailAsync(email, token);
        
        if (!sucesso)
        {
            if (mensagem.Contains("não encontrado")) return NotFound(new AuthResultDto { Mensagem = mensagem });
            if (mensagem.Contains("inválido")) return Unauthorized(new AuthResultDto { Mensagem = mensagem });
            return BadRequest(new AuthResultDto { Mensagem = mensagem });
        }

        return Ok(new AuthResultDto { Mensagem = mensagem });
    }

    /// <summary>
    /// Realiza o login utilizando e-mail e senha.
    /// </summary>
    /// <remarks>
    /// Valida as credenciais tradicionais e retorna o token JWT de sessão. Requer que o e-mail tenha sido confirmado.
    /// </remarks>
    /// <response code="200">Login realizado com sucesso.</response>
    /// <response code="401">Credenciais inválidas ou e-mail não confirmado.</response>
    [HttpPost("login")]
    [ProducesResponseType(typeof(LoginResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var (sucesso, mensagem, dadosLogin) = await _authService.LoginAsync(request);
        if (!sucesso) return Unauthorized(new AuthResultDto { Mensagem = mensagem });
        return Ok(dadosLogin);
    }
    
    /// <summary>
    /// Realiza o login social utilizando uma conta Google.
    /// </summary>
    /// <remarks>
    /// Valida o token OAuth2 fornecido pelo Google e cria a conta automaticamente caso seja o primeiro acesso.
    /// </remarks>
    /// <response code="200">Autenticação social realizada com sucesso.</response>
    /// <response code="400">Falha ao validar o token com os servidores do Google.</response>
    [HttpPost("login-google")]
    [ProducesResponseType(typeof(LoginResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> LoginGoogle([FromBody] LoginGoogleRequest request)
    {
        var (sucesso, mensagem, dadosLogin) = await _authService.LoginGoogleAsync(request.Token);
        if (!sucesso) return BadRequest(new AuthResultDto { Mensagem = mensagem });
        return Ok(dadosLogin);
    }
    
    /// <summary>
    /// Realiza o login social utilizando uma conta Microsoft.
    /// </summary>
    /// <remarks>
    /// Valida o token OAuth2 fornecido pela Microsoft (Graph API) e cria a conta automaticamente caso seja o primeiro acesso.
    /// </remarks>
    /// <response code="200">Autenticação social realizada com sucesso.</response>
    /// <response code="400">Falha ao validar o token com os servidores da Microsoft.</response>
    [HttpPost("login-microsoft")]
    [ProducesResponseType(typeof(LoginResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> LoginMicrosoft([FromBody] LoginMicrosoftRequest request)
    {
        var (sucesso, mensagem, dadosLogin) = await _authService.LoginMicrosoftAsync(request.Token);
        if (!sucesso) return BadRequest(new AuthResultDto { Mensagem = mensagem });
        return Ok(dadosLogin);
    }
    
    /// <summary>
    /// Solicita a recuperação de senha.
    /// </summary>
    /// <remarks>
    /// Gera um código numérico de 6 dígitos e envia para o e-mail do usuário. O código expira em 15 minutos.
    /// </remarks>
    /// <response code="200">Instruções enviadas para o e-mail (caso exista na base).</response>
    [HttpPost("esqueci-senha")]
    [ProducesResponseType(typeof(AuthResultDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> EsqueciSenha([FromBody] EsqueciSenhaRequest request)
    {
        var (sucesso, mensagem) = await _authService.EsqueciSenhaAsync(request.Email);
        return Ok(new AuthResultDto { Mensagem = mensagem });
    }

    /// <summary>
    /// Redefine a senha utilizando um código de recuperação.
    /// </summary>
    /// <remarks>
    /// Valida o código enviado por e-mail e aplica a nova senha informada pelo usuário.
    /// </remarks>
    /// <response code="200">Senha atualizada com sucesso.</response>
    /// <response code="400">Código inválido, expirado ou usuário não encontrado.</response>
    [HttpPost("redefinir-senha")]
    [ProducesResponseType(typeof(AuthResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RedefinirSenha([FromBody] RedefinirSenhaRequest request)
    {
        var (sucesso, mensagem) = await _authService.RedefinirSenhaAsync(request);
        if (!sucesso) return BadRequest(new AuthResultDto { Mensagem = mensagem });
        return Ok(new AuthResultDto { Mensagem = mensagem });
    }
}