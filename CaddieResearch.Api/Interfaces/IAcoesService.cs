using CaddieResearch.Api.DTOs.Acoes;

namespace CaddieResearch.Api.Interfaces;

public interface IAcoesService
{
    Task<(bool Sucesso, string Mensagem, CotacaoResultDto? Cotacao)> ObterCotacaoAsync(string ticker);
    Task<List<string>> ObterTickersDisponiveisAsync();
    Task<List<string>> ObterTickersInternacionaisAsync();
}