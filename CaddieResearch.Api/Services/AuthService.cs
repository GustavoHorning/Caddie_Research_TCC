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
        var emailNormalizado = request.Email.Trim().ToLower();
        var emailExiste = await _context.Usuarios.AnyAsync(u => u.Email.ToLower() == emailNormalizado);
        if (emailExiste) return (false, "Este e-mail já está em uso no Caddie Research.");

        string tokenGerado = Guid.NewGuid().ToString();

        var novoUsuario = new Usuario
        {
            Nome = request.Nome.Trim(),
            Email = emailNormalizado,
            SenhaHash = _tokenService.HashPassword(request.Senha),
            TokenConfirmacaoEmail = tokenGerado
        };

        _context.Usuarios.Add(novoUsuario);
        await _context.SaveChangesAsync();

        await GarantirPortfolioInicialAsync(novoUsuario.Id);

        var emailCodificado = Uri.EscapeDataString(novoUsuario.Email);
        var frontendUrl = _configuration["FrontendUrl"] ?? "http://localhost:5173";
        var linkDeConfirmacao = $"{frontendUrl}/confirmar-email?email={emailCodificado}&token={tokenGerado}";        
        await _emailService.EnviarEmailConfirmacaoAsync(novoUsuario.Email, novoUsuario.Nome, linkDeConfirmacao);

        return (true, "Usuário cadastrado com sucesso! Verifique seu e-mail para validar a conta.");
    }

    public async Task<(bool Sucesso, string Mensagem)> ConfirmarEmailAsync(string email, string token)
    {
        var emailNormalizado = email.Trim().ToLower();
        var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Email.ToLower() == emailNormalizado);
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
        var emailNormalizado = request.Email.Trim().ToLower();
        var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Email.ToLower() == emailNormalizado);
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

        var emailNormalizado = googleUser.email.Trim().ToLower();
        var nome = string.IsNullOrWhiteSpace(googleUser.name) ? emailNormalizado.Split('@')[0] : googleUser.name;

        var usuario = await ProcessarLoginSocial(emailNormalizado, nome);
        return (true, string.Empty, GerarDadosLogin("Login com Google realizado com sucesso!", usuario));
    }

    public async Task<(bool Sucesso, string Mensagem, LoginResultDto? DadosLogin)> LoginMicrosoftAsync(string token)
    {
        _httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        var response = await _httpClient.GetAsync("https://graph.microsoft.com/v1.0/me");

        if (!response.IsSuccessStatusCode) return (false, "Não foi possível validar sua conta com a Microsoft.", null);

        var msUser = await response.Content.ReadFromJsonAsync<MicrosoftUserInfo>();
        var email = ExtrairEmailMicrosoft(msUser);

        if (string.IsNullOrEmpty(email)) return (false, "Não conseguimos ler o e-mail da sua conta Microsoft.", null);

        var nome = !string.IsNullOrWhiteSpace(msUser?.displayName) ? msUser.displayName : email.Split('@')[0];
        var usuario = await ProcessarLoginSocial(email, nome);
        return (true, string.Empty, GerarDadosLogin("Login com Microsoft realizado com sucesso!", usuario));
    }

    public async Task<(bool Sucesso, string Mensagem, LoginResultDto? DadosLogin)> LoginSsoCorporativoAsync(string token)
    {
        _httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        var response = await _httpClient.GetAsync("https://graph.microsoft.com/v1.0/me");

        if (!response.IsSuccessStatusCode)
            return (false, "Não foi possível validar a credencial corporativa no Microsoft Entra ID.", null);

        var msUser = await response.Content.ReadFromJsonAsync<MicrosoftUserInfo>();
        var emailCorporativo = ExtrairEmailMicrosoft(msUser);

        if (string.IsNullOrEmpty(emailCorporativo))
            return (false, "Não foi possível identificar o e-mail corporativo no diretório da Azure.", null);

        var emailsGestoresConfig = _configuration.GetSection("SsoCorporativo:EmailsAutorizados").Get<string[]>() ?? Array.Empty<string>();
        var dominiosCorporativos = _configuration.GetSection("SsoCorporativo:DominiosAutorizados").Get<string[]>() ?? Array.Empty<string>();

        bool autorizadoPorConfig = emailsGestoresConfig.Any(e => e.Equals(emailCorporativo, StringComparison.OrdinalIgnoreCase)) ||
                                   dominiosCorporativos.Any(d => emailCorporativo.EndsWith($"@{d.TrimStart('@')}", StringComparison.OrdinalIgnoreCase));

        var usuario = await _context.Usuarios.FirstOrDefaultAsync(u =>
            u.Email.ToLower() == emailCorporativo ||
            (!string.IsNullOrEmpty(msUser!.userPrincipalName) && u.Email.ToLower() == msUser.userPrincipalName.ToLower()));

        if (usuario == null)
        {
            if (!autorizadoPorConfig)
            {
                return (false, $"Acesso negado: A conta '{emailCorporativo}' não pertence ao grupo de Gestores no Microsoft Entra ID.", null);
            }

            usuario = new Usuario
            {
                Nome = !string.IsNullOrWhiteSpace(msUser?.displayName) ? msUser.displayName : "Gestor Caddie",
                Email = emailCorporativo,
                EmailConfirmado = true,
                TipoPerfil = "Gestor",
                Plano = "Gestor",
                SenhaHash = _tokenService.HashPassword(Guid.NewGuid().ToString() + "CaddieSSO@2026!"),
                EhSocial = true
            };

            _context.Usuarios.Add(usuario);
            await _context.SaveChangesAsync();
        }
        else
        {
            bool ehGestorNoBanco = string.Equals(usuario.TipoPerfil, "Gestor", StringComparison.OrdinalIgnoreCase) ||
                                  string.Equals(usuario.Plano, "Gestor", StringComparison.OrdinalIgnoreCase);

            if (!ehGestorNoBanco && !autorizadoPorConfig)
            {
                return (false, "Acesso restrito: Este canal de Single Sign-On (SSO) é exclusivo para Gestores autorizados.", null);
            }

            usuario.TipoPerfil = "Gestor";
            usuario.EmailConfirmado = true;
            usuario.TokenConfirmacaoEmail = null;
            await _context.SaveChangesAsync();
        }

        return (true, string.Empty, GerarDadosLogin("Autenticação via SSO Corporativo realizada com sucesso!", usuario));
    }

    public async Task<(bool Sucesso, string Mensagem)> EsqueciSenhaAsync(string email)
    {
        var emailNormalizado = email.Trim().ToLower();
        var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Email.ToLower() == emailNormalizado);
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
        var emailNormalizado = request.Email.Trim().ToLower();
        var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Email.ToLower() == emailNormalizado);
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
        var emailNormalizado = email.Trim().ToLower();
        var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Email.ToLower() == emailNormalizado);
        if (usuario == null)
        {
            usuario = new Usuario
            {
                Nome = nome,
                Email = emailNormalizado,
                EmailConfirmado = true, 
                SenhaHash = _tokenService.HashPassword(Guid.NewGuid().ToString() + "CaddieSocial@2026!"), 
                EhSocial = true
            };
            _context.Usuarios.Add(usuario);
            await _context.SaveChangesAsync();
        }
        else if (!usuario.EmailConfirmado)
        {
            usuario.EmailConfirmado = true;
            usuario.TokenConfirmacaoEmail = null;
            await _context.SaveChangesAsync();
        }

        await GarantirPortfolioInicialAsync(usuario.Id);
        return usuario;
    }

    private async Task GarantirPortfolioInicialAsync(int usuarioId)
    {
        var possuiPortfolio = await _context.Portfolios.AnyAsync(p => p.UsuarioId == usuarioId);
        if (!possuiPortfolio)
        {
            _context.Portfolios.Add(new Portfolio
            {
                UsuarioId = usuarioId,
                Nome = "Portfólio Inicial",
                DataInicio = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();
        }
    }

    private static string? ExtrairEmailMicrosoft(MicrosoftUserInfo? msUser)
    {
        if (msUser == null) return null;

        if (!string.IsNullOrWhiteSpace(msUser.mail))
        {
            return msUser.mail.Trim().ToLower();
        }

        if (!string.IsNullOrWhiteSpace(msUser.userPrincipalName))
        {
            var upn = msUser.userPrincipalName.Trim();
            var extIndex = upn.IndexOf("#EXT#@", StringComparison.OrdinalIgnoreCase);
            if (extIndex > 0)
            {
                var prefixo = upn.Substring(0, extIndex);
                var lastUnderscore = prefixo.LastIndexOf('_');
                if (lastUnderscore > 0)
                {
                    return (prefixo.Substring(0, lastUnderscore) + "@" + prefixo.Substring(lastUnderscore + 1)).ToLower();
                }
            }

            return upn.ToLower();
        }

        return null;
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