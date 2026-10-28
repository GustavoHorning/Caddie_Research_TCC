using Microsoft.AspNetCore.Http;
using CaddieResearch.Api.DTOs.Forum;

namespace CaddieResearch.Api.Interfaces;

public interface IForumService
{
    IEnumerable<string> ObterCategorias();
    Task<IEnumerable<ForumTopicoResultDto>> ObterTopicosAsync(int usuarioId, string? categoria, string? busca);
    Task<(bool Sucesso, string Mensagem, ForumTopicoDetalheResultDto? Topico)> ObterTopicoDetalheAsync(int id, int usuarioId, bool ehGestor);
    Task<(bool Sucesso, string Mensagem, int? TopicoId, string? Status)> CriarTopicoAsync(int usuarioId, bool ehGestor, ForumTopicoRequestDto dto);
    Task<IEnumerable<ForumTopicoResultDto>> ObterMeusTopicosAsync(int usuarioId);
    Task<(IEnumerable<ForumTopicoResultDto> Chamados, Dictionary<string, int> Contagem)> ObterChamadosAsync(string status);
    Task<(bool Sucesso, string Mensagem)> AprovarTopicoAsync(int id);
    Task<(bool Sucesso, string Mensagem)> RecusarTopicoAsync(int id, string motivo);
    Task<(bool Sucesso, string Mensagem)> ExcluirTopicoAsync(int id, int usuarioId, bool ehGestor);
    Task<(bool Sucesso, string Mensagem, int? RespostaId)> ResponderTopicoAsync(int id, int usuarioId, bool ehGestor, string? conteudo, List<IFormFile> anexos, IFormFile? audio);
    Task<(bool Sucesso, string Mensagem)> ExcluirRespostaAsync(int id, int usuarioId, bool ehGestor);
    Task<(bool Sucesso, string Mensagem, bool Curtido, int Total)> CurtirTopicoAsync(int id, int usuarioId);
    Task<(bool Sucesso, string Mensagem, bool Curtido, int Total)> CurtirRespostaAsync(int id, int usuarioId);
}