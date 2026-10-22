using Microsoft.AspNetCore.Mvc;
using CaddieResearch.Api.Services;

namespace CaddieResearch.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class InternacionalController : ControllerBase
{
    private readonly InternacionalService _internacionalService;

    public InternacionalController(InternacionalService internacionalService)
    {
        _internacionalService = internacionalService;
    }

    /// <summary>
    /// Retorna a cotação de ativos da Bolsa Americana (NYSE/NASDAQ).
    /// </summary>
    /// <remarks>
    /// Acessa o provedor internacional (Finnhub) para carregar cotações de ETFs, Stocks e BDRs gringos.
    /// </remarks>
    /// <param name="ticker">O código de negociação. Ex: AAPL, SPY</param>
    /// <response code="200">Cotação retornada com sucesso.</response>
    /// <response code="404">Ticker inválido no provedor internacional.</response>
    [HttpGet("cotacao/{ticker}")]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetCotacao(string ticker)
    {
        var cotacao = await _internacionalService.ObterCotacaoUsdAsync(ticker);

        if (cotacao == null)
        {
            return NotFound(new { mensagem = $"Não foi possível encontrar dados para o ativo internacional {ticker}." });
        }

        return Ok(cotacao);
    }
}