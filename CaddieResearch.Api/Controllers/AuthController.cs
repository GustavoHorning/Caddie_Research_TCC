using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CaddieResearch.Api.Data;
using CaddieResearch.Api.Models;
using CaddieResearch.Api.Services;
using CaddieResearch.Api.DTOs.Auth; 

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

    [HttpPost("cadastrar")]
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
    
    [HttpGet("confirmar-email")]
    public async Task<IActionResult> ConfirmarEmail([FromQuery] string email, [FromQuery] string token)
    {
        var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Email == email);

        if (usuario == null)
            return NotFound(new { mensagem = "Usuário não encontrado." });

        if (usuario.EmailConfirmado)
            return BadRequest(new { mensagem = "Este e-mail já foi confirmado anteriormente." });
        
        if (usuario.TokenConfirmacaoEmail != token)
            return Unauthorized(new { mensagem = "Token de verificação inválido ou expirado." });

        usuario.EmailConfirmado = true;
        usuario.TokenConfirmacaoEmail = null;
        await _context.SaveChangesAsync();

        return Ok(new { mensagem = "E-mail confirmado com sucesso! Você já pode fazer login no Caddie Research." });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Email == request.Email);
       
        if (usuario == null)
            return Unauthorized(new { mensagem = "E-mail ou senha incorretos." }); 
        
        var senhaValida = _tokenService.VerifyPassword(request.Senha, usuario.SenhaHash);
        if (!senhaValida)
            return Unauthorized(new { mensagem = "E-mail ou senha incorretos." });
        
        if (!usuario.EmailConfirmado)
            return Unauthorized(new { mensagem = "Acesso negado. Por favor, confirme seu e-mail antes de fazer login." });

        var token = _tokenService.GenerateToken(usuario);

        return Ok(new 
        { 
            mensagem = "Login realizado com sucesso!",
            token = token,
            usuario = new { id = usuario.Id, nome = usuario.Nome, email = usuario.Email }
        });
    }
    
    [HttpPost("login-google")]
    public async Task<IActionResult> LoginGoogle([FromBody] LoginGoogleRequest request)
    {
        using var httpClient = new HttpClient();
        httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", request.Token);
        
        var response = await httpClient.GetAsync("https://www.googleapis.com/oauth2/v3/userinfo");

        if (!response.IsSuccessStatusCode)
            return BadRequest(new { mensagem = "Não foi possível validar sua conta com o Google." });

        var googleUser = await response.Content.ReadFromJsonAsync<GoogleUserInfo>();
        
        if (googleUser == null || string.IsNullOrEmpty(googleUser.email))
            return BadRequest(new { mensagem = "Dados do Google inválidos." });

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
            usuario = new { id = usuario.Id, nome = usuario.Nome, email = usuario.Email }
        });
    }
    
    [HttpPost("login-microsoft")]
    public async Task<IActionResult> LoginMicrosoft([FromBody] LoginMicrosoftRequest request)
    {
        using var httpClient = new HttpClient();
        httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", request.Token);
        
        var response = await httpClient.GetAsync("https://graph.microsoft.com/v1.0/me");

        if (!response.IsSuccessStatusCode)
            return BadRequest(new { mensagem = "Não foi possível validar sua conta com a Microsoft." });

        var msUser = await response.Content.ReadFromJsonAsync<MicrosoftUserInfo>();
        var emailDaMicrosoft = !string.IsNullOrEmpty(msUser?.mail) ? msUser.mail : msUser?.userPrincipalName;

        if (string.IsNullOrEmpty(emailDaMicrosoft))
            return BadRequest(new { mensagem = "Não conseguimos ler o e-mail da sua conta Microsoft." });

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
            usuario = new { id = usuario.Id, nome = usuario.Nome, email = usuario.Email }
        });
    }
    
    [HttpPost("esqueci-senha")]
    public async Task<IActionResult> EsqueciSenha([FromBody] EsqueciSenhaRequest request)
    {
        var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Email == request.Email);
        
        if (usuario == null)
            return Ok(new { mensagem = "Se o e-mail estiver correto, você receberá o código em instantes." });

        var random = new Random();
        string codigo = random.Next(100000, 999999).ToString();

        usuario.CodigoRecuperacao = codigo;
        usuario.DataExpiracaoCodigo = DateTime.UtcNow.AddMinutes(15);
        await _context.SaveChangesAsync();

        await _emailService.EnviarEmailRecuperacaoAsync(usuario.Email, usuario.Nome, codigo);

        return Ok(new { mensagem = "Código enviado com sucesso!" });
    }

    [HttpPost("redefinir-senha")]
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
            return BadRequest(new { mensagem = "A nova senha não pode ser igual à senha atual. Escolha uma senha diferente." });

        usuario.SenhaHash = _tokenService.HashPassword(request.NovaSenha); 
        usuario.CodigoRecuperacao = null;
        usuario.DataExpiracaoCodigo = null;

        await _context.SaveChangesAsync();

        return Ok(new { mensagem = "Senha redefinida com sucesso!" });
    }
}