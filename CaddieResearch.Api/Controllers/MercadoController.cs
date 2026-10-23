using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CaddieResearch.Api.Interfaces; 

namespace CaddieResearch.Api.Controllers;

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

    [HttpGet("historico")]
    public async Task<IActionResult> GetHistorico([FromQuery] string ticker, [FromQuery] string range = "1y", [FromQuery] string interval = "1d")
    {
        if (string.IsNullOrWhiteSpace(ticker)) return BadRequest(new { erro = "Ticker é obrigatório." });

        try
        {
            var json = await _mercadoService.ObterHistoricoYahooAsync(ticker, range, interval);
            return Content(json, "application/json");
        }
        catch (HttpRequestException ex)
        {
            return BadRequest(new { erro = "Falha ao buscar dados no Yahoo Finance.", detalhe = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }

    [HttpGet("futuro")]
    public async Task<IActionResult> GetCotacaoFuturo([FromQuery] string ticker)
    {
        if (string.IsNullOrWhiteSpace(ticker)) return BadRequest(new { erro = "Ticker é obrigatório." });

        try
        {
            var json = await _mercadoService.ObterCotacaoFuturoB3Async(ticker);
            return Content(json, "application/json");
        }
        catch (HttpRequestException ex)
        {
            return BadRequest(new { erro = "Falha ao buscar dados na B3.", detalhe = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }

    [HttpGet("cdi")]
    public async Task<IActionResult> GetCdi([FromQuery] string? dataInicial, [FromQuery] string? dataFinal)
    {
        try
        {
            var json = await _mercadoService.ObterCdiBcbAsync(dataInicial, dataFinal);
            return Content(json, "application/json");
        }
        catch (HttpRequestException ex)
        {
            return BadRequest(new { erro = "Falha ao buscar dados no Banco Central.", detalhe = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }
}