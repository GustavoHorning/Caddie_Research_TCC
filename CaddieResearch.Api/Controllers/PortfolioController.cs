using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using CaddieResearch.Api.DTOs.Portfolio;
using CaddieResearch.Api.Interfaces; 

namespace CaddieResearch.Api.Controllers;

/// <summary>
/// Gerencia os portfólios pessoais dos usuários e as suas posições (Ativos comprados).
/// </summary>
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

    /// <summary>
    /// Lista todos os portfólios vinculados ao usuário logado, calculando patrimônio e aportes.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<PortfolioResultDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetPortfolios()
    {
        var usuarioId = GetUsuarioId();
        if (usuarioId == 0) return Unauthorized();

        var resultado = await _portfolioService.GetPortfoliosAsync(usuarioId);
        return Ok(resultado);
    }

    /// <summary>
    /// Cria um novo portfólio para o usuário (ex: Carteira de Aposentadoria, Curto Prazo, etc).
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(PortfolioResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CriarPortfolio([FromBody] CriarPortfolioRequestDto req)
    {
        var usuarioId = GetUsuarioId();
        if (usuarioId == 0) return Unauthorized();

        var resultado = await _portfolioService.CriarPortfolioAsync(usuarioId, req);
        return Ok(resultado);
    }

    /// <summary>
    /// Retorna os detalhes e as posições ativas de um portfólio específico.
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(PortfolioDetalheResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(PortfolioErrorDto), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPortfolio(int id)
    {
        var usuarioId = GetUsuarioId();
        if (usuarioId == 0) return Unauthorized();

        var portfolio = await _portfolioService.GetPortfolioAsync(id, usuarioId);

        if (portfolio == null) return NotFound(new PortfolioErrorDto { Mensagem = "Portfólio não encontrado." });

        return Ok(portfolio);
    }

    /// <summary>
    /// Adiciona um novo ativo (Posição) dentro do portfólio.
    /// </summary>
    [HttpPost("{id}/posicoes")]
    [ProducesResponseType(typeof(PosicaoResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(PortfolioErrorDto), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AdicionarPosicao(int id, [FromBody] PosicaoRequestDto dto)
    {
        var usuarioId = GetUsuarioId();
        if (usuarioId == 0) return Unauthorized();

        var posicao = await _portfolioService.AdicionarPosicaoAsync(id, usuarioId, dto);

        if (posicao == null) return NotFound(new PortfolioErrorDto { Mensagem = "Portfólio não encontrado." });

        return Ok(posicao);
    }

    /// <summary>
    /// Remove um ativo (Posição) do portfólio do usuário.
    /// </summary>
    [HttpDelete("{portfolioId}/posicoes/{posicaoId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(PortfolioErrorDto), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoverPosicao(int portfolioId, int posicaoId)
    {
        var usuarioId = GetUsuarioId();
        if (usuarioId == 0) return Unauthorized();

        var sucesso = await _portfolioService.RemoverPosicaoAsync(portfolioId, posicaoId, usuarioId);

        if (!sucesso) return NotFound(new PortfolioErrorDto { Mensagem = "Posição ou portfólio não encontrado." });

        return NoContent();
    }
}