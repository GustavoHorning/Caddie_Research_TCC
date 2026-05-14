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

    [HttpGet("cotacao/{ticker}")]
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