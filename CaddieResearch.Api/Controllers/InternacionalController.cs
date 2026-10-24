using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using CaddieResearch.Api.Interfaces;
using CaddieResearch.Api.DTOs.Internacional;

namespace CaddieResearch.Api.Controllers;

/// <summary>
/// Gerencia a busca de cotações de ativos em bolsas estrangeiras (NYSE, NASDAQ).
/// </summary>
[Route("api/[controller]")]
[ApiController]
public class InternacionalController : ControllerBase
{
    private readonly IInternacionalService _internacionalService;

    // Correção Arquitetural: Injetando a Interface (IInternacionalService) e não a classe concreta
    public InternacionalController(IInternacionalService internacionalService)
    {
        _internacionalService = internacionalService;
    }

    /// <summary>
    /// Retorna a cotação de ativos da Bolsa Americana (NYSE/NASDAQ).
    /// </summary>
    /// <remarks>
    /// Acessa provedores internacionais (como Finnhub) para carregar cotações de ETFs, Stocks e BDRs, já retornando o valor convertido para Reais (BRL) usando a cotação do dólar em tempo real.
    /// Possui cache interno de 5 minutos para otimização de requisições.
    /// </remarks>
    /// <param name="ticker">O código de negociação. Ex: AAPL, SPY, TSLA</param>
    /// <response code="200">Cotação retornada com sucesso.</response>
    /// <response code="404">Ticker inválido ou não encontrado no provedor internacional.</response>
    [HttpGet("cotacao/{ticker}")]
    [ProducesResponseType(typeof(InternacionalResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(InternacionalErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCotacao(string ticker)
    {
        var cotacao = await _internacionalService.ObterCotacaoUsdAsync(ticker);

        if (cotacao == null)
        {
            return NotFound(new InternacionalErrorResponse { Mensagem = $"Não foi possível encontrar dados para o ativo internacional {ticker.ToUpper()}." });
        }

        return Ok(cotacao);
    }
}