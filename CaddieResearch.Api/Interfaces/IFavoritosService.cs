using CaddieResearch.Api.DTOs.Favoritos;

namespace CaddieResearch.Api.Interfaces;

public interface IFavoritosService
{
    Task<List<FavoritoResultDto>> ObterFavoritosAsync(int usuarioId);
    Task<(bool Sucesso, string Mensagem)> AdicionarFavoritoAsync(int usuarioId, FavoritoDto dto);
    Task<(bool Sucesso, string Mensagem)> AtualizarAnotacaoAsync(int usuarioId, string ticker, AnotacaoDto dto);
    Task<(bool Sucesso, string Mensagem)> RemoverFavoritoAsync(int usuarioId, string ticker);
}