using Microsoft.AspNetCore.Http;
using CaddieResearch.Api.DTOs.Usuario;

namespace CaddieResearch.Api.Interfaces;

public interface IUsuarioService
{
    Task<UsuarioPerfilResultDto?> ObterPerfilAsync(int userId);
    Task<(bool Sucesso, string Mensagem)> AtualizarPerfilAsync(int userId, AtualizarPerfilRequestDto dto);
    Task<(bool Sucesso, string Mensagem)> AlterarSenhaAsync(int userId, AlterarSenhaRequestDto dto);
    Task<(bool Sucesso, string Mensagem, string? Url)> UploadFotoAsync(int userId, IFormFile foto);
    Task<(bool Sucesso, string Mensagem)> RemoverFotoAsync(int userId);
    Task<(bool Sucesso, string Mensagem)> ExcluirContaAsync(int userId);
}