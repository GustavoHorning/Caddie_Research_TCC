using CaddieResearch.Api.DTOs.Calendario;

namespace CaddieResearch.Api.Interfaces;

public interface ICalendarioService
{
    Task<List<EventoResultDto>> ObterEventosAsync();
    Task<List<EventoResultDto>> ObterEventosDashboardAsync();
    Task<(bool Sucesso, string Mensagem, EventoResultDto? Evento)> AtualizarEventoPeloGestorAsync(int id, AtualizarEventoDto dto);
    Task<(bool Sucesso, string Mensagem, int EventoId)> CriarEventoCaddieAsync(CriarEventoCaddieDto dto);
    Task<(bool Sucesso, string Mensagem)> DeletarEventoAsync(int id);
}