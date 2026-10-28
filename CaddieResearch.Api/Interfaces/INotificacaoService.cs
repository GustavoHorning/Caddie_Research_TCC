using CaddieResearch.Api.DTOs.Notificacoes;

namespace CaddieResearch.Api.Interfaces;

public interface INotificacaoService
{
    Task DispararNotificacaoCarteiraAsync(int carteiraId, string titulo, string mensagem);
    Task DispararNotificacaoEventoCaddieAsync(string titulo, string mensagem);
    Task DispararNotificacaoMorningCallAsync(string titulo);
    Task<IEnumerable<NotificacaoResultDto>> ObterNotificacoesAsync(int usuarioId);
    Task DispararNotificacaoTesteAsync(DispararNotificacaoDto dto);
    Task MarcarComoLidaAsync(int notificacaoId, int usuarioId);
    Task MarcarTodasComoLidasAsync(int usuarioId);
    Task DispararNotificacaoRelatorioAsync(int carteiraId, string titulo, string mensagem);
}