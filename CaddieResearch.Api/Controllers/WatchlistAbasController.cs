using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using CaddieResearch.Api.Interfaces;
using CaddieResearch.Api.DTOs.Watchlist;

namespace CaddieResearch.Api.Controllers;

/// <summary>
/// Gerencia as abas personalizadas para organização da Watchlist do usuário.
/// </summary>
[ApiController]
[Route("api/watchlist-abas")]
[Authorize]
public class WatchlistAbasController : ControllerBase
{
    private readonly IWatchlistAbasService _abasService;

    public WatchlistAbasController(IWatchlistAbasService abasService)
    {
        _abasService = abasService;
    }

    private int ObterUsuarioLogadoId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(claim, out int id) ? id : 0;
    }

    /// <summary>
    /// Retorna todas as abas criadas pelo usuário e os respectivos ativos (Tickers) contidos nelas.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<WatchlistAbaResultDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetAbas()
    {
        int usuarioId = ObterUsuarioLogadoId();
        if (usuarioId == 0) return Unauthorized(new WatchlistAbaResponseDto { Mensagem = "Usuário não autenticado." });

        var abas = await _abasService.ObterAbasAsync(usuarioId);
        return Ok(abas);
    }

    /// <summary>
    /// Cria uma nova aba personalizada na Watchlist.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(WatchlistAbaResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(WatchlistAbaResponseDto), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CriarAba([FromBody] CriarAbaRequestDto dto)
    {
        int usuarioId = ObterUsuarioLogadoId();
        if (usuarioId == 0) return Unauthorized();

        var (sucesso, mensagem, aba) = await _abasService.CriarAbaAsync(usuarioId, dto);

        if (!sucesso) return BadRequest(new WatchlistAbaResponseDto { Mensagem = mensagem });

        return Ok(aba);
    }

    /// <summary>
    /// Exclui uma aba personalizada (Os ativos continuarão na Watchlist principal).
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(WatchlistAbaResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(WatchlistAbaResponseDto), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ExcluirAba(int id)
    {
        int usuarioId = ObterUsuarioLogadoId();
        if (usuarioId == 0) return Unauthorized();

        var sucesso = await _abasService.ExcluirAbaAsync(id, usuarioId);

        if (!sucesso) return NotFound(new WatchlistAbaResponseDto { Mensagem = "Aba não encontrada." });

        return Ok(new WatchlistAbaResponseDto { Mensagem = "Aba excluída." });
    }

    /// <summary>
    /// Associa um ativo já favoritado a uma aba específica.
    /// </summary>
    [HttpPost("{id}/favoritos/{ticker}")]
    [ProducesResponseType(typeof(WatchlistAbaResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(WatchlistAbaResponseDto), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AdicionarFavoritoNaAba(int id, string ticker)
    {
        int usuarioId = ObterUsuarioLogadoId();
        if (usuarioId == 0) return Unauthorized();

        var (sucesso, mensagem) = await _abasService.AdicionarFavoritoNaAbaAsync(id, ticker, usuarioId);

        if (!sucesso) return BadRequest(new WatchlistAbaResponseDto { Mensagem = mensagem });

        return Ok(new WatchlistAbaResponseDto { Mensagem = mensagem });
    }

    /// <summary>
    /// Remove um ativo de uma aba específica (Ele continuará na Watchlist principal).
    /// </summary>
    [HttpDelete("{id}/favoritos/{ticker}")]
    [ProducesResponseType(typeof(WatchlistAbaResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(WatchlistAbaResponseDto), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoverFavoritoDaAba(int id, string ticker)
    {
        int usuarioId = ObterUsuarioLogadoId();
        if (usuarioId == 0) return Unauthorized();

        var sucesso = await _abasService.RemoverFavoritoDaAbaAsync(id, ticker, usuarioId);

        if (!sucesso) return NotFound(new WatchlistAbaResponseDto { Mensagem = "Relação não encontrada." });

        return Ok(new WatchlistAbaResponseDto { Mensagem = "Removido da aba." });
    }
}