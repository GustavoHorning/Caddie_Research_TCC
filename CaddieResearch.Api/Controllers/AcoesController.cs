using Microsoft.AspNetCore.Mvc;
using CaddieResearch.Api.Services;

namespace CaddieResearch.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AcoesController : ControllerBase
{
    private readonly AcoesService _acoesService;

    public AcoesController(AcoesService acoesService)
    {
        _acoesService = acoesService;
    }

    [HttpGet("cotacao/{ticker}")]
    public async Task<IActionResult> GetCotacao(string ticker)
    {
        var cotacao = await _acoesService.ObterCotacaoAsync(ticker);

        if (cotacao == null)
        {
            return NotFound(new { mensagem = $"Não foi possível encontrar dados para o ativo {ticker}." });
        }

        return Ok(cotacao);
    }
}