using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using CaddieResearch.Api.Interfaces;
using CaddieResearch.Api.DTOs.Favoritos; 

namespace CaddieResearch.Api.Controllers;

/// <summary>
/// Gerencia os ativos favoritados (Watchlist) pelos usuários.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FavoritosController : ControllerBase
{
    private readonly IFavoritosService _favoritosService;

    public FavoritosController(IFavoritosService favoritosService)
    {
        _favoritosService = favoritosService;
    }

    private int ObterUsuarioLogadoId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(userIdClaim, out int id) ? id : 0;
    }

    /// <summary>
    /// Retorna a lista de ativos favoritados pelo usuário logado.
    /// </summary>
    /// <response code="200">Watchlist retornada com sucesso.</response>
    /// <response code="401">Usuário não autenticado.</response>
    [HttpGet]
    [ProducesResponseType(typeof(List<FavoritoResultDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetFavoritos()
    {
        int usuarioId = ObterUsuarioLogadoId();
        if (usuarioId == 0) return Unauthorized(new { erro = "Usuário não autenticado." });

        var favoritos = await _favoritosService.ObterFavoritosAsync(usuarioId);

        return Ok(favoritos);
    }

    /// <summary>
    /// Adiciona um novo ativo à Watchlist do usuário.
    /// </summary>
    /// <response code="200">Ativo adicionado com sucesso.</response>
    /// <response code="400">Ativo já existe na Watchlist do usuário.</response>
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AddFavorito([FromBody] FavoritoDto dto)
    {
        int usuarioId = ObterUsuarioLogadoId();
        var (sucesso, mensagem) = await _favoritosService.AdicionarFavoritoAsync(usuarioId, dto);

        if (!sucesso) return BadRequest(new { erro = mensagem });
        return Ok(new { mensagem });
    }

    /// <summary>
    /// Atualiza a anotação pessoal de um ativo favoritado.
    /// </summary>
    /// <response code="200">Anotação salva com sucesso.</response>
    /// <response code="404">Ativo não encontrado na Watchlist.</response>
    [HttpPatch("{ticker}/anotacao")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AtualizarAnotacao(string ticker, [FromBody] AnotacaoDto dto)
    {
        int usuarioId = ObterUsuarioLogadoId();
        var (sucesso, mensagem) = await _favoritosService.AtualizarAnotacaoAsync(usuarioId, ticker, dto);

        if (!sucesso) return NotFound(new { erro = mensagem });
        return Ok(new { mensagem });
    }

    /// <summary>
    /// Remove um ativo da Watchlist do usuário.
    /// </summary>
    /// <response code="200">Ativo removido com sucesso.</response>
    /// <response code="404">Ativo não encontrado na Watchlist.</response>
    [HttpDelete("{ticker}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveFavorito(string ticker)
    {
        int usuarioId = ObterUsuarioLogadoId();
        var (sucesso, mensagem) = await _favoritosService.RemoverFavoritoAsync(usuarioId, ticker);

        if (!sucesso) return NotFound(new { erro = mensagem });
        return Ok(new { mensagem });
    }
}