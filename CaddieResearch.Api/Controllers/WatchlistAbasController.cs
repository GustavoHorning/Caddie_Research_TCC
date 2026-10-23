using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using CaddieResearch.Api.Interfaces;
using CaddieResearch.Api.DTOs.Watchlist;

namespace CaddieResearch.Api.Controllers;

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

    [HttpGet]
    public async Task<IActionResult> GetAbas()
    {
        int usuarioId = ObterUsuarioLogadoId();
        if (usuarioId == 0) return Unauthorized();

        var abas = await _abasService.ObterAbasAsync(usuarioId);
        return Ok(abas);
    }

    [HttpPost]
    public async Task<IActionResult> CriarAba([FromBody] CriarAbaRequestDto dto)
    {
        int usuarioId = ObterUsuarioLogadoId();
        if (usuarioId == 0) return Unauthorized();

        var (sucesso, mensagem, aba) = await _abasService.CriarAbaAsync(usuarioId, dto);

        if (!sucesso) return BadRequest(new { erro = mensagem });

        return Ok(aba);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> ExcluirAba(int id)
    {
        int usuarioId = ObterUsuarioLogadoId();
        if (usuarioId == 0) return Unauthorized();

        var sucesso = await _abasService.ExcluirAbaAsync(id, usuarioId);

        if (!sucesso) return NotFound(new { erro = "Aba não encontrada." });

        return Ok(new { mensagem = "Aba excluída." });
    }

    [HttpPost("{id}/favoritos/{ticker}")]
    public async Task<IActionResult> AdicionarFavoritoNaAba(int id, string ticker)
    {
        int usuarioId = ObterUsuarioLogadoId();
        if (usuarioId == 0) return Unauthorized();

        var (sucesso, mensagem) = await _abasService.AdicionarFavoritoNaAbaAsync(id, ticker, usuarioId);

        if (!sucesso) return BadRequest(new { erro = mensagem });

        return Ok(new { mensagem });
    }

    [HttpDelete("{id}/favoritos/{ticker}")]
    public async Task<IActionResult> RemoverFavoritoDaAba(int id, string ticker)
    {
        int usuarioId = ObterUsuarioLogadoId();
        if (usuarioId == 0) return Unauthorized();

        var sucesso = await _abasService.RemoverFavoritoDaAbaAsync(id, ticker, usuarioId);

        if (!sucesso) return NotFound(new { erro = "Relação não encontrada." });

        return Ok(new { mensagem = "Removido da aba." });
    }
}