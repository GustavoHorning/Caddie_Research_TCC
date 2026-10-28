namespace CaddieResearch.Api.Interfaces;

public interface IMercadoService
{
    Task<string> ObterHistoricoYahooAsync(string ticker, string range, string interval);
    Task<string> ObterCotacaoFuturoB3Async(string ticker);
    Task<string> ObterCdiBcbAsync(string? dataInicial, string? dataFinal);
}