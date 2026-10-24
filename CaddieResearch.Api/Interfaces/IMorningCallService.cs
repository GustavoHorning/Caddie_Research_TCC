
using CaddieResearch.Api.DTOs.MorningCall;

namespace CaddieResearch.Api.Interfaces;

public interface IMorningCallService
{
    Task<List<MorningCallResultDto>> ObterTodosAsync();
    Task<List<MorningCallResultDto>> ObterMeusAsync(int gestorId);
    Task<(bool Sucesso, string Mensagem, int? Id)> CriarAsync(int gestorId, string titulo, string data, string topicosJson, IFormFile? audio, IFormFileCollection arquivosForm);
    Task<(bool Sucesso, string Mensagem)> AtualizarAsync(int id, int gestorId, string titulo, string data, string topicosJson, string? removerAudio, IFormFile? audio, IFormFileCollection arquivosForm);
    Task<(bool Sucesso, string Mensagem)> DeletarAsync(int id, int gestorId);
    Task<(bool Sucesso, string Mensagem)> DeletarTopicoAsync(int morningCallId, int topicoId, int gestorId);
}