using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using CaddieResearch.Api.DTOs.Portfolio;
using CaddieResearch.Api.Interfaces; 

namespace CaddieResearch.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class PortfolioController : ControllerBase
{
    private readonly IPortfolioService _portfolioService; 

    public PortfolioController(IPortfolioService portfolioService)
    {
        _portfolioService = portfolioService;
    }

    private int GetUsuarioId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(claim, out int id) ? id : 0;
    }

    [HttpGet]
    public async Task<IActionResult> GetPortfolios()
    {
        var usuarioId = GetUsuarioId();
        if (usuarioId == 0) return Unauthorized();

        var resultado = await _portfolioService.GetPortfoliosAsync(usuarioId);
        return Ok(resultado);
    }

    [HttpPost]
    public async Task<IActionResult> CriarPortfolio([FromBody] CriarPortfolioRequestDto req)
    {
        var usuarioId = GetUsuarioId();
        if (usuarioId == 0) return Unauthorized();

        var resultado = await _portfolioService.CriarPortfolioAsync(usuarioId, req);
        return Ok(resultado);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetPortfolio(int id)
    {
        var usuarioId = GetUsuarioId();
        if (usuarioId == 0) return Unauthorized();

        var portfolio = await _portfolioService.GetPortfolioAsync(id, usuarioId);

        if (portfolio == null) return NotFound(new { mensagem = "Portfólio não encontrado." });

        return Ok(portfolio);
    }

    [HttpPost("{id}/posicoes")]
    public async Task<IActionResult> AdicionarPosicao(int id, [FromBody] PosicaoRequestDto dto)
    {
        var usuarioId = GetUsuarioId();
        if (usuarioId == 0) return Unauthorized();

        var posicao = await _portfolioService.AdicionarPosicaoAsync(id, usuarioId, dto);

        if (posicao == null) return NotFound(new { mensagem = "Portfólio não encontrado." });

        return Ok(posicao);
    }

    [HttpDelete("{portfolioId}/posicoes/{posicaoId}")]
    public async Task<IActionResult> RemoverPosicao(int portfolioId, int posicaoId)
    {
        var usuarioId = GetUsuarioId();
        if (usuarioId == 0) return Unauthorized();

        var sucesso = await _portfolioService.RemoverPosicaoAsync(portfolioId, posicaoId, usuarioId);

        if (!sucesso) return NotFound(new { mensagem = "Posição ou portfólio não encontrado." });

        return NoContent();
    }
}