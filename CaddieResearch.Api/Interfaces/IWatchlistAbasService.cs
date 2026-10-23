using CaddieResearch.Api.DTOs.Watchlist;

namespace CaddieResearch.Api.Interfaces;

public interface IWatchlistAbasService
{
    Task<IEnumerable<WatchlistAbaResultDto>> ObterAbasAsync(int usuarioId);
    Task<(bool Sucesso, string Mensagem, WatchlistAbaResultDto? Aba)> CriarAbaAsync(int usuarioId, CriarAbaRequestDto dto);
    Task<bool> ExcluirAbaAsync(int abaId, int usuarioId);
    Task<(bool Sucesso, string Mensagem)> AdicionarFavoritoNaAbaAsync(int abaId, string ticker, int usuarioId);
    Task<bool> RemoverFavoritoDaAbaAsync(int abaId, string ticker, int usuarioId);
}