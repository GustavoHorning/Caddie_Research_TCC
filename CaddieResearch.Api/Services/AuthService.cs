using CaddieResearch.Api.Data;
using CaddieResearch.Api.Models;
using CaddieResearch.Api.DTOs.Auth;
using CaddieResearch.Api.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace CaddieResearch.Api.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _context;
    private readonly TokenService _tokenService;
    private readonly EmailService _emailService;
    private readonly IConfiguration _configuration;
    private readonly HttpClient _httpClient;

    public AuthService(AppDbContext context, TokenService tokenService, EmailService emailService, IConfiguration configuration, HttpClient httpClient)
    {
        _context = context;
        _tokenService = tokenService;
        _emailService = emailService;
        _configuration = configuration;
        _httpClient = httpClient;
    }

    public async Task<(bool Sucesso, string Mensagem)> CadastrarAsync(CadastrarUsuarioRequest request)
    {
        var emailExiste = await _context.Usuarios.AnyAsync(u => u.Email == request.Email);
        if (emailExiste) return (false, "Este e-mail já está em uso no Caddie Research.");

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

        return (true, "Usuário cadastrado com sucesso! Verifique seu e-mail para validar a conta.");
    }

    public async Task<(bool Sucesso, string Mensagem)> ConfirmarEmailAsync(string email, string token)
    {
        var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Email == email);
        if (usuario == null) return (false, "Usuário não encontrado.");
        if (usuario.EmailConfirmado) return (false, "Este e-mail já foi confirmado anteriormente.");
        if (usuario.TokenConfirmacaoEmail != token) return (false, "Token de verificação inválido ou expirado.");

        usuario.EmailConfirmado = true;
        usuario.TokenConfirmacaoEmail = null;
        await _context.SaveChangesAsync();

        return (true, "E-mail confirmado com sucesso! Você já pode fazer login.");
    }

    public async Task<(bool Sucesso, string Mensagem, LoginResultDto? DadosLogin)> LoginAsync(LoginRequest request)
    {
        var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (usuario == null) return (false, "E-mail ou senha incorretos.", null);
        
        var senhaValida = _tokenService.VerifyPassword(request.Senha, usuario.SenhaHash);
        if (!senhaValida) return (false, "E-mail ou senha incorretos.", null);
        
        if (!usuario.EmailConfirmado) return (false, "Acesso negado. Por favor, confirme seu e-mail antes de fazer login.", null);

        var token = _tokenService.GenerateToken(usuario);

        var resultado = new LoginResultDto
        {
            Mensagem = "Login realizado com sucesso!",
            Token = token,
            Usuario = new UsuarioLogadoDto { Id = usuario.Id, Nome = usuario.Nome, Email = usuario.Email }
        };

        return (true, string.Empty, resultado);
    }

    public async Task<(bool Sucesso, string Mensagem, LoginResultDto? DadosLogin)> LoginGoogleAsync(string token)
    {
        _httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        var response = await _httpClient.GetAsync("https://www.googleapis.com/oauth2/v3/userinfo");

        if (!response.IsSuccessStatusCode) return (false, "Não foi possível validar sua conta com o Google.", null);

        var googleUser = await response.Content.ReadFromJsonAsync<GoogleUserInfo>();
        if (googleUser == null || string.IsNullOrEmpty(googleUser.email)) return (false, "Dados do Google inválidos.", null);

        var usuario = await ProcessarLoginSocial(googleUser.email, googleUser.name);
        return (true, string.Empty, GerarDadosLogin("Login com Google realizado com sucesso!", usuario));
    }

    public async Task<(bool Sucesso, string Mensagem, LoginResultDto? DadosLogin)> LoginMicrosoftAsync(string token)
    {
        _httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        var response = await _httpClient.GetAsync("https://graph.microsoft.com/v1.0/me");

        if (!response.IsSuccessStatusCode) return (false, "Não foi possível validar sua conta com a Microsoft.", null);

        var msUser = await response.Content.ReadFromJsonAsync<MicrosoftUserInfo>();
        var email = !string.IsNullOrEmpty(msUser?.mail) ? msUser.mail : msUser?.userPrincipalName;

        if (string.IsNullOrEmpty(email)) return (false, "Não conseguimos ler o e-mail da sua conta Microsoft.", null);

        var usuario = await ProcessarLoginSocial(email, msUser!.displayName);
        return (true, string.Empty, GerarDadosLogin("Login com Microsoft realizado com sucesso!", usuario));
    }

    public async Task<(bool Sucesso, string Mensagem)> EsqueciSenhaAsync(string email)
    {
        var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Email == email);
        if (usuario == null) return (true, "Se o e-mail estiver correto, você receberá o código em instantes.");

        string codigo = new Random().Next(100000, 999999).ToString();
        usuario.CodigoRecuperacao = codigo;
        usuario.DataExpiracaoCodigo = DateTime.UtcNow.AddMinutes(15);
        await _context.SaveChangesAsync();

        await _emailService.EnviarEmailRecuperacaoAsync(usuario.Email, usuario.Nome, codigo);
        return (true, "Código enviado com sucesso!");
    }

    public async Task<(bool Sucesso, string Mensagem)> RedefinirSenhaAsync(RedefinirSenhaRequest request)
    {
        var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (usuario == null) return (false, "Usuário não encontrado.");
        if (usuario.CodigoRecuperacao != request.Token) return (false, "Código inválido. Verifique se digitou corretamente.");
        if (usuario.DataExpiracaoCodigo < DateTime.UtcNow) return (false, "O código expirou. Por favor, solicite um novo.");
        
        var usouMesmaSenha = _tokenService.VerifyPassword(request.NovaSenha, usuario.SenhaHash);
        if (usouMesmaSenha) return (false, "A nova senha não pode ser igual à senha atual. Escolha uma senha diferente.");

        usuario.SenhaHash = _tokenService.HashPassword(request.NovaSenha); 
        usuario.CodigoRecuperacao = null;
        usuario.DataExpiracaoCodigo = null;
        await _context.SaveChangesAsync();

        return (true, "Senha redefinida com sucesso!");
    }

    private async Task<Usuario> ProcessarLoginSocial(string email, string nome)
    {
        var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Email == email);
        if (usuario == null)
        {
            usuario = new Usuario
            {
                Nome = nome,
                Email = email,
                EmailConfirmado = true, 
                SenhaHash = _tokenService.HashPassword(Guid.NewGuid().ToString() + "CaddieSocial@2026!"), 
                EhSocial = true
            };
            _context.Usuarios.Add(usuario);
            await _context.SaveChangesAsync();
        }
        return usuario;
    }

    private LoginResultDto GerarDadosLogin(string mensagem, Usuario usuario)
    {
        return new LoginResultDto
        {
            Mensagem = mensagem,
            Token = _tokenService.GenerateToken(usuario),
            Usuario = new UsuarioLogadoDto { Id = usuario.Id, Nome = usuario.Nome, Email = usuario.Email }
        };
    }
}