using CaddieResearch.Api.DTOs.Ativos;

namespace CaddieResearch.Api.Interfaces;

public interface IAtivosService
{
    Task<(bool Sucesso, string Mensagem, AtivoResultDto? Ativo)> CriarAtivoAsync(int gestorId, AtivoRequestDto dto);
    Task<(bool Sucesso, string Mensagem, AtivoResultDto? Ativo)> AtualizarAtivoAsync(int id, int gestorId, AtivoRequestDto dto);
    Task<(bool Sucesso, string Mensagem)> DeletarAtivoAsync(int id, int gestorId);
}