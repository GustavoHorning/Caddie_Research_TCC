using CaddieResearch.Api.DTOs.Carteiras;

namespace CaddieResearch.Api.Interfaces;

public interface ICarteirasService
{
    Task<(bool Sucesso, string Mensagem, List<CarteiraResultDto>? Carteiras)> ObterCarteirasPermitidasAsync(int usuarioId);
    Task<(bool Sucesso, string Mensagem, CarteiraResultDto? Carteira)> ObterCarteiraDetalhadaAsync(int carteiraId, int usuarioId);
}