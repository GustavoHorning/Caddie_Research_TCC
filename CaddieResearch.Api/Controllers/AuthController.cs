using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CaddieResearch.Api.Data;
using CaddieResearch.Api.Models;
using CaddieResearch.Api.Services;

namespace CaddieResearch.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly TokenService _tokenService;
    private readonly EmailService _emailService;
    private readonly IConfiguration _configuration;

    public AuthController(AppDbContext context, TokenService tokenService, EmailService emailService, IConfiguration configuration)
    {
        _context = context;
        _tokenService = tokenService;
        _emailService = emailService; 
        _configuration = configuration;
    }

    /// <summary>
    /// Cadastra um novo usuário no sistema.
    /// </summary>
    /// <remarks>
    /// Valida a duplicidade de e-mail, aplica o hash na senha, cria um portfólio inicial vazio e dispara um e-mail de confirmação para o cliente.
    /// </remarks>
    /// <response code="201">Usuário cadastrado com sucesso. E-mail de confirmação enviado.</response>
    /// <response code="400">E-mail já está em uso ou dados de cadastro inválidos.</response>
    [HttpPost("cadastrar")]
    [ProducesResponseType(201)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> Cadastrar([FromBody] CadastrarUsuarioRequest request)
    {
        var emailExiste = await _context.Usuarios.AnyAsync(u => u.Email == request.Email);
        if (emailExiste)
        {
            return BadRequest(new { mensagem = "Este e-mail já está em uso no Caddie Research." });
        }
        
        string tokenGerado = Guid.NewGuid().ToString();

        var novoUsuario = new Usuario
        {
            Nome = request.Nome,
            Email = request.Email,
            SenhaHash = _tokenService.HashPassword(request.Senha),
            TokenConfirmacaoEmail = tokenGerado
        };

        _context.Usuarios.Add(novoUsuario);
        await _context.SaveChangesAsync();

        _context.Portfolios.Add(new Portfolio
        {
            UsuarioId = novoUsuario.Id,
            Nome = "Portfólio Inicial",
            DataInicio = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        var emailCodificado = Uri.EscapeDataString(novoUsuario.Email);
        var frontendUrl = _configuration["FrontendUrl"] ?? "http://localhost:5173";
        var linkDeConfirmacao = $"{frontendUrl}/confirmar-email?email={emailCodificado}&token={tokenGerado}";        
        await _emailService.EnviarEmailConfirmacaoAsync(novoUsuario.Email, novoUsuario.Nome, linkDeConfirmacao);

        return Created("", new { mensagem = "Usuário cadastrado com sucesso! Verifique seu e-mail para validar a conta." });
    }
    
    /// <summary>
    /// Confirma o e-mail de um usuário recém-cadastrado.
    /// </summary>
    /// <remarks>
    /// Recebe o token gerado no ato do cadastro e ativa a conta do usuário para permitir o login no sistema.
    /// </remarks>
    /// <response code="200">E-mail confirmado com sucesso.</response>
    /// <response code="400">O e-mail já havia sido confirmado anteriormente.</response>
    /// <response code="401">O token de verificação é inválido ou expirou.</response>
    /// <response code="404">Usuário não encontrado.</response>
    [HttpGet("confirmar-email")]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> ConfirmarEmail([FromQuery] string email, [FromQuery] string token)
    {
        var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Email == email);

        if (usuario == null)
        {
            return NotFound(new { mensagem = "Usuário não encontrado." });
        }

        if (usuario.EmailConfirmado)
        {
            return BadRequest(new { mensagem = "Este e-mail já foi confirmado anteriormente." });
        }
        
        if (usuario.TokenConfirmacaoEmail != token)
        {
            return Unauthorized(new { mensagem = "Token de verificação inválido ou expirado." });
        }

        usuario.EmailConfirmado = true;
        usuario.TokenConfirmacaoEmail = null;
        await _context.SaveChangesAsync();

        return Ok(new { mensagem = "E-mail confirmado com sucesso! Você já pode fazer login no Caddie Research." });
    }

    /// <summary>
    /// Autentica um usuário e retorna o Token JWT.
    /// </summary>
    /// <remarks>
    /// Valida as credenciais do usuário na base de dados e gera um token JWT contendo as claims de acesso (Cliente ou Gestor).
    /// </remarks>
    /// <response code="200">Login realizado com sucesso. Retorna o token de acesso e os dados básicos do usuário.</response>
    /// <response code="401">E-mail/senha incorretos ou e-mail ainda não confirmado.</response>
    [HttpPost("login")]
    [ProducesResponseType(200)]
    [ProducesResponseType(401)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Email == request.Email);

        if (usuario == null)
        {
            return Unauthorized(new { mensagem = "E-mail ou senha incorretos." }); 
        }

        var senhaValida = _tokenService.VerifyPassword(request.Senha, usuario.SenhaHash);
        if (!senhaValida)
        {
            return Unauthorized(new { mensagem = "E-mail ou senha incorretos." });
        }
        
        if (!usuario.EmailConfirmado)
        {
            return Unauthorized(new { mensagem = "Acesso negado. Por favor, confirme seu e-mail antes de fazer login." });
        }

        var token = _tokenService.GenerateToken(usuario);

        return Ok(new 
        { 
            mensagem = "Login realizado com sucesso!",
            token = token,
            usuario = new 
            { 
                id = usuario.Id, 
                nome = usuario.Nome, 
                email = usuario.Email 
            }
        });
    }
    
    /// <summary>
    /// Realiza o login utilizando a conta Google.
    /// </summary>
    /// <remarks>
    /// Valida o token de acesso diretamente na API do Google e, caso seja o primeiro acesso, cadastra o usuário silenciosamente (Social Login).
    /// </remarks>
    /// <response code="200">Login social realizado com sucesso.</response>
    /// <response code="400">Falha ao validar os dados na API do Google.</response>
    [HttpPost("login-google")]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> LoginGoogle([FromBody] LoginGoogleRequest request)
    {
        using var httpClient = new HttpClient();
        httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", request.Token);
        
        var response = await httpClient.GetAsync("https://www.googleapis.com/oauth2/v3/userinfo");

        if (!response.IsSuccessStatusCode)
        {
            return BadRequest(new { mensagem = "Não foi possível validar sua conta com o Google." });
        }

        var googleUser = await response.Content.ReadFromJsonAsync<GoogleUserInfo>();
        
        if (googleUser == null || string.IsNullOrEmpty(googleUser.email))
        {
            return BadRequest(new { mensagem = "Dados do Google inválidos." });
        }

        var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Email == googleUser.email);

        if (usuario == null)
        {
            usuario = new Usuario
            {
                Nome = googleUser.name,
                Email = googleUser.email,
                EmailConfirmado = true, 
                SenhaHash = _tokenService.HashPassword(Guid.NewGuid().ToString() + "Caddie@2026!"), 
                EhSocial = true
            };

            _context.Usuarios.Add(usuario);
            await _context.SaveChangesAsync();
        }

        var tokenCaddie = _tokenService.GenerateToken(usuario);

        return Ok(new 
        { 
            mensagem = "Login com Google realizado com sucesso!",
            token = tokenCaddie,
            usuario = new 
            { 
                id = usuario.Id, 
                nome = usuario.Nome, 
                email = usuario.Email 
            }
        });
    }
    
    /// <summary>
    /// Realiza o login utilizando a conta Microsoft.
    /// </summary>
    /// <remarks>
    /// Valida o token de acesso através da Microsoft Graph API e, caso seja o primeiro acesso, cadastra o usuário silenciosamente (Social Login).
    /// </remarks>
    /// <response code="200">Login social realizado com sucesso.</response>
    /// <response code="400">Falha ao validar os dados na API da Microsoft.</response>
    [HttpPost("login-microsoft")]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> LoginMicrosoft([FromBody] LoginMicrosoftRequest request)
    {
        using var httpClient = new HttpClient();
        httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", request.Token);
        
        var response = await httpClient.GetAsync("https://graph.microsoft.com/v1.0/me");

        if (!response.IsSuccessStatusCode)
        {
            return BadRequest(new { mensagem = "Não foi possível validar sua conta com a Microsoft." });
        }

        var msUser = await response.Content.ReadFromJsonAsync<MicrosoftUserInfo>();
        
        var emailDaMicrosoft = !string.IsNullOrEmpty(msUser?.mail) ? msUser.mail : msUser?.userPrincipalName;

        if (string.IsNullOrEmpty(emailDaMicrosoft))
        {
            return BadRequest(new { mensagem = "Não conseguimos ler o e-mail da sua conta Microsoft." });
        }

        var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Email == emailDaMicrosoft);

        if (usuario == null)
        {
            usuario = new Usuario
            {
                Nome = msUser!.displayName,
                Email = emailDaMicrosoft,
                EmailConfirmado = true,
                SenhaHash = _tokenService.HashPassword(Guid.NewGuid().ToString() + "CaddieMS@2026!"),
                EhSocial = true
            };

            _context.Usuarios.Add(usuario);
            await _context.SaveChangesAsync();
        }

        var tokenCaddie = _tokenService.GenerateToken(usuario);

        return Ok(new 
        { 
            mensagem = "Login com Microsoft realizado com sucesso!",
            token = tokenCaddie,
            usuario = new 
            { 
                id = usuario.Id, 
                nome = usuario.Nome, 
                email = usuario.Email 
            }
        });
    }

    /// <summary>
    /// Solicita um código de recuperação de senha.
    /// </summary>
    /// <remarks>
    /// Gera um código numérico de 6 dígitos com validade de 15 minutos e envia para o e-mail cadastrado. Retorna sucesso mesmo se o e-mail não existir por motivos de segurança (evitar enumeração de e-mails).
    /// </remarks>
    /// <response code="200">Processo iniciado com sucesso (código enviado se o e-mail existir).</response>
    [HttpPost("esqueci-senha")]
    [ProducesResponseType(200)]
    public async Task<IActionResult> EsqueciSenha([FromBody] EsqueciSenhaRequest request)
    {
        var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Email == request.Email);
        
        if (usuario == null)
        {
            return Ok(new { mensagem = "Se o e-mail estiver correto, você receberá o código em instantes." });
        }

        var random = new Random();
        string codigo = random.Next(100000, 999999).ToString();

        usuario.CodigoRecuperacao = codigo;
        usuario.DataExpiracaoCodigo = DateTime.UtcNow.AddMinutes(15);
        await _context.SaveChangesAsync();

        await _emailService.EnviarEmailRecuperacaoAsync(usuario.Email, usuario.Nome, codigo);

        return Ok(new { mensagem = "Código enviado com sucesso!" });
    }

    /// <summary>
    /// Redefine a senha do usuário utilizando o código de segurança.
    /// </summary>
    /// <remarks>
    /// Valida o código recebido por e-mail e aplica a nova senha informada (apenas se for diferente da atual).
    /// </remarks>
    /// <response code="200">Senha atualizada com sucesso.</response>
    /// <response code="400">Código inválido, expirado, usuário não encontrado ou senha repetida.</response>
    [HttpPost("redefinir-senha")]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> RedefinirSenha([FromBody] RedefinirSenhaRequest request)
    {
        var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Email == request.Email);
        
        if (usuario == null) 
            return BadRequest(new { mensagem = "Usuário não encontrado." });

        if (usuario.CodigoRecuperacao != request.Token)
            return BadRequest(new { mensagem = "Código inválido. Verifique se digitou corretamente." });

        if (usuario.DataExpiracaoCodigo < DateTime.UtcNow)
            return BadRequest(new { mensagem = "O código expirou. Por favor, solicite um novo." });
        
        var usouMesmaSenha = _tokenService.VerifyPassword(request.NovaSenha, usuario.SenhaHash);
        if (usouMesmaSenha)
        {
            return BadRequest(new { mensagem = "A nova senha não pode ser igual à senha atual. Escolha uma senha diferente." });
        }

        usuario.SenhaHash = _tokenService.HashPassword(request.NovaSenha); 
        
        usuario.CodigoRecuperacao = null;
        usuario.DataExpiracaoCodigo = null;

        await _context.SaveChangesAsync();

        return Ok(new { mensagem = "Senha redefinida com sucesso!" });
    }
}

public class CadastrarUsuarioRequest
{
    /// <summary>
    /// Nome completo do usuário.
    /// </summary>
    /// <example>João da Silva</example>
    [Required(ErrorMessage = "O nome é obrigatório.")]
    [MinLength(3, ErrorMessage = "O nome deve ter no mínimo 3 caracteres.")]
    [MaxLength(100, ErrorMessage = "O nome excedeu o limite de 100 caracteres.")]
    public string Nome { get; set; } = string.Empty;

    /// <summary>
    /// E-mail principal de acesso.
    /// </summary>
    /// <example>joao.silva@caddieresearch.com.br</example>
    [Required(ErrorMessage = "O e-mail é obrigatório.")]
    [EmailAddress(ErrorMessage = "O formato do e-mail é inválido.")]
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// Senha de acesso com regras fortes de validação.
    /// </summary>
    /// <example>SenhaForte@2026</example>
    [Required(ErrorMessage = "A senha é obrigatória.")]
    [MinLength(8, ErrorMessage = "A senha deve ter no mínimo 8 caracteres.")]
    [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$", 
        ErrorMessage = "A senha deve conter pelo menos 8 caracteres, uma letra maiúscula, uma minúscula, um número e um caractere especial.")]
    public string Senha { get; set; } = string.Empty;
}

public class LoginRequest
{
    /// <summary>
    /// E-mail do usuário cadastrado.
    /// </summary>
    /// <example>cliente.premium@caddieresearch.com.br</example>
    [Required(ErrorMessage = "O e-mail é obrigatório.")]
    [EmailAddress(ErrorMessage = "O formato do e-mail é inválido.")]
    public string Email { get; set; } = string.Empty;
    
    /// <summary>
    /// Senha de acesso.
    /// </summary>
    /// <example>Caddie@2026!</example>
    [Required(ErrorMessage = "A senha é obrigatória.")]
    public string Senha { get; set; } = string.Empty;
}

public class EsqueciSenhaRequest
{
    /// <summary>
    /// E-mail do usuário que esqueceu a senha.
    /// </summary>
    /// <example>cliente.premium@caddieresearch.com.br</example>
    public string Email { get; set; } = string.Empty;
}

public class RedefinirSenhaRequest
{
    /// <summary>
    /// E-mail da conta a ser recuperada.
    /// </summary>
    /// <example>cliente.premium@caddieresearch.com.br</example>
    [Required(ErrorMessage = "O e-mail é obrigatório.")]
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// Código numérico de 6 dígitos recebido por e-mail.
    /// </summary>
    /// <example>123456</example>
    [Required(ErrorMessage = "O código é obrigatório.")]
    public string Token { get; set; } = string.Empty; 

    /// <summary>
    /// Nova senha a ser definida no sistema.
    /// </summary>
    /// <example>NovaSenha@2027!</example>
    [Required(ErrorMessage = "A nova senha é obrigatória.")]
    [MinLength(8, ErrorMessage = "A senha deve ter no mínimo 8 caracteres.")]
    [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$", 
        ErrorMessage = "A senha deve conter pelo menos 8 caracteres, uma letra maiúscula, uma minúscula, um número e um caractere especial.")]
    public string NovaSenha { get; set; } = string.Empty;
}

public class LoginGoogleRequest
{
    /// <summary>
    /// Token gerado pela validação nativa do Google.
    /// </summary>
    /// <example>ya29.a0AfB_byC...</example>
    public string Token { get; set; } = string.Empty;
}

public class GoogleUserInfo
{
    public string email { get; set; } = string.Empty;
    public string name { get; set; } = string.Empty;
    public bool email_verified { get; set; }
}

public class LoginMicrosoftRequest
{
    /// <summary>
    /// Token gerado pela validação nativa da Microsoft.
    /// </summary>
    /// <example>EwBoA8l6BAAU7p9...</example>
    public string Token { get; set; } = string.Empty;
}

public class MicrosoftUserInfo
{
    public string displayName { get; set; } = string.Empty;
    public string mail { get; set; } = string.Empty;
    public string userPrincipalName { get; set; } = string.Empty;
}