using CaddieResearch.Api.DTOs.Historico;

namespace CaddieResearch.Api.Interfaces;

public interface IHistoricoService
{
    Task<List<HistoricoAtivoAgrupadoDto>> ObterHistoricoCentradoNoAtivoAsync(int carteiraId, int usuarioId, int nivelAcesso, bool ehGestor);
    Task<List<HistoricoAtivoAgrupadoDto>> ObterHistoricoGlobalAsync(int usuarioId, int nivelAcesso, bool ehGestor);
}