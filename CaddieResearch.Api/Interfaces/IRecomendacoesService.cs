using CaddieResearch.Api.DTOs.Recomendacoes;
using CaddieResearch.Api.DTOs.Portfolio; 

namespace CaddieResearch.Api.Interfaces;

public interface IRecomendacoesService
{
    Task<IEnumerable<RecomendacaoResultDto>> ObterMinhasRecomendacoesAsync(int clienteId);
    Task<IEnumerable<RecomendacaoResultDto>> ObterRecomendacoesEnviadasAsync(int gestorId);
    Task<RecomendacaoResultDto> CriarRecomendacaoAsync(int gestorId, RecomendacaoRequestDto dto);
    Task<(bool Sucesso, string Mensagem, PosicaoResultDto? Posicao)> AderirRecomendacaoAsync(int recomendacaoId, int clienteId);
    Task<(bool Sucesso, string Mensagem)> RecusarRecomendacaoAsync(int recomendacaoId, int clienteId);
    Task<IEnumerable<ClienteResultDto>> ObterClientesParaRecomendacaoAsync();
}