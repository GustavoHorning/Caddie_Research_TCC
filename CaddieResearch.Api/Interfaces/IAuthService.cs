using CaddieResearch.Api.DTOs.Auth;

namespace CaddieResearch.Api.Interfaces;

public interface IAuthService
{
    Task<(bool Sucesso, string Mensagem)> CadastrarAsync(CadastrarUsuarioRequest request);
    Task<(bool Sucesso, string Mensagem)> ConfirmarEmailAsync(string email, string token);
    Task<(bool Sucesso, string Mensagem, LoginResultDto? DadosLogin)> LoginAsync(LoginRequest request);
    Task<(bool Sucesso, string Mensagem, LoginResultDto? DadosLogin)> LoginGoogleAsync(string token);
    Task<(bool Sucesso, string Mensagem, LoginResultDto? DadosLogin)> LoginMicrosoftAsync(string token);
    Task<(bool Sucesso, string Mensagem)> EsqueciSenhaAsync(string email);
    Task<(bool Sucesso, string Mensagem)> RedefinirSenhaAsync(RedefinirSenhaRequest request);
}