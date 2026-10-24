using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CaddieResearch.Api.Interfaces;
using CaddieResearch.Api.DTOs.Mercado;

namespace CaddieResearch.Api.Controllers;

/// <summary>
/// API Proxy para consultas em tempo real de provedores externos (Yahoo Finance, B3, BCB).
/// </summary>
[Route("api/[controller]")]
[ApiController]
[Authorize]
public class MercadoController : ControllerBase
{
    private readonly IMercadoService _mercadoService; 

    public MercadoController(IMercadoService mercadoService)
    {
        _mercadoService = mercadoService;
    }

    /// <summary>
    /// Retorna o histórico de preços (OHLC) de um ativo via Yahoo Finance.
    /// </summary>
    /// <remarks>
    /// Atua como um proxy para evitar bloqueios de CORS no frontend e centralizar a chamada.
    /// Suporta ativos brasileiros (ex: PETR4.SA) e internacionais (ex: AAPL).
    /// </remarks>
    /// <param name="ticker">O código do ativo. Adicione '.SA' para ações brasileiras.</param>
    /// <param name="range">O período histórico. Padrões: 1d, 5d, 1mo, 3mo, 6mo, 1y, 5y, max.</param>
    /// <param name="interval">O intervalo dos candles. Padrões: 1m, 15m, 1d, 1wk, 1mo.</param>
    /// <response code="200">JSON bruto com o gráfico retornado pelo Yahoo.</response>
    /// <response code="400">Parâmetros inválidos ou erro no provedor.</response>
    [HttpGet("historico")]
    [ProducesResponseType(typeof(YahooChartResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(MercadoErrorDto), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetHistorico([FromQuery] string ticker, [FromQuery] string range = "1y", [FromQuery] string interval = "1d")
    {
        if (string.IsNullOrWhiteSpace(ticker)) 
            return BadRequest(new MercadoErrorDto { Erro = "Ticker é obrigatório." });

        try
        {
            var json = await _mercadoService.ObterHistoricoYahooAsync(ticker, range, interval);
            return Content(json, "application/json");
        }
        catch (HttpRequestException ex)
        {
            return BadRequest(new MercadoErrorDto { Erro = "Falha ao buscar dados no Yahoo Finance.", Detalhe = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new MercadoErrorDto { Erro = "Erro interno no servidor.", Detalhe = ex.Message });
        }
    }

    /// <summary>
    /// Retorna a cotação em tempo real de contratos futuros diretamente da B3.
    /// </summary>
    /// <remarks>
    /// Útil para contratos como Índice (WIN) e Dólar (WDO). Atua como proxy para a API pública da B3.
    /// </remarks>
    /// <param name="ticker">O código do contrato futuro. Ex: WINV26</param>
    [HttpGet("futuro")]
    [ProducesResponseType(typeof(B3FuturoResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(MercadoErrorDto), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetCotacaoFuturo([FromQuery] string ticker)
    {
        if (string.IsNullOrWhiteSpace(ticker)) 
            return BadRequest(new MercadoErrorDto { Erro = "Ticker é obrigatório." });

        try
        {
            var json = await _mercadoService.ObterCotacaoFuturoB3Async(ticker);
            return Content(json, "application/json");
        }
        catch (HttpRequestException ex)
        {
            return BadRequest(new MercadoErrorDto { Erro = "Falha ao buscar dados na B3.", Detalhe = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new MercadoErrorDto { Erro = "Erro interno no servidor.", Detalhe = ex.Message });
        }
    }

    /// <summary>
    /// Retorna a série histórica da taxa CDI do Banco Central do Brasil (SGS).
    /// </summary>
    /// <remarks>
    /// Se as datas não forem informadas, retorna automaticamente a última taxa diária disponível.
    /// As datas devem estar no formato brasileiro (DD/MM/YYYY).
    /// </remarks>
    [HttpGet("cdi")]
    [ProducesResponseType(typeof(List<CdiBcbDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(MercadoErrorDto), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetCdi([FromQuery] string? dataInicial, [FromQuery] string? dataFinal)
    {
        try
        {
            var json = await _mercadoService.ObterCdiBcbAsync(dataInicial, dataFinal);
            return Content(json, "application/json");
        }
        catch (HttpRequestException ex)
        {
            return BadRequest(new MercadoErrorDto { Erro = "Falha ao buscar dados no Banco Central.", Detalhe = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new MercadoErrorDto { Erro = "Erro interno no servidor.", Detalhe = ex.Message });
        }
    }
}