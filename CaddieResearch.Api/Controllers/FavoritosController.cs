using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CaddieResearch.Api.Data;
using CaddieResearch.Api.Models;

namespace CaddieResearch.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FavoritosController : ControllerBase
{
    private readonly AppDbContext _context;

    public FavoritosController(AppDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Lista os ativos salvos na Watchlist Global do usuário.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(200)]
    public async Task<IActionResult> GetFavoritos()
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdClaim, out int usuarioId))
            return Unauthorized();

        var favoritos = await _context.Favoritos
            .Where(f => f.UsuarioId == usuarioId)
            .OrderByDescending(f => f.DataAdicionado)
            .ToListAsync();

        return Ok(favoritos);
    }

    /// <summary>
    /// Adiciona um ativo à Watchlist do usuário.
    /// </summary>
    /// <remarks>
    /// Valida duplicidade. Usado no painel do cliente para monitoramento personalizado de cotações.
    /// </remarks>
    [HttpPost]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> AddFavorito([FromBody] FavoritoDto dto)
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdClaim, out int usuarioId))
            return Unauthorized();

        var jaExiste = await _context.Favoritos
            .AnyAsync(f => f.UsuarioId == usuarioId && f.Ticker == dto.Ticker);

        if (jaExiste)
            return BadRequest(new { mensagem = "Ativo já está na watchlist." });

        var favorito = new Favorito
        {
            UsuarioId = usuarioId,
            Ticker = dto.Ticker,
            NomeEmpresa = dto.NomeEmpresa,
            Categoria = dto.Categoria,
            Rentabilidade = dto.Rentabilidade,
            NomeCarteira = dto.NomeCarteira
        };

        _context.Favoritos.Add(favorito);
        await _context.SaveChangesAsync();

        return Ok(new { mensagem = "Adicionado à watchlist!" });
    }

    /// <summary>
    /// Atualiza as anotações textuais privadas de um ativo favoritado.
    /// </summary>
    [HttpPatch("{ticker}/anotacao")]
    [ProducesResponseType(200)]
    public async Task<IActionResult> AtualizarAnotacao(string ticker, [FromBody] AnotacaoDto dto)
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdClaim, out int usuarioId))
            return Unauthorized();

        var favorito = await _context.Favoritos
            .FirstOrDefaultAsync(f => f.UsuarioId == usuarioId && f.Ticker == ticker);

        if (favorito == null)
            return NotFound();

        favorito.Anotacao = dto.Anotacao;
        await _context.SaveChangesAsync();

        return Ok(new { mensagem = "Anotação salva!" });
    }

    /// <summary>
    /// Remove um ativo da Watchlist.
    /// </summary>
    /// <remarks>
    /// Remove os relacionamentos (abas customizadas) antes de deletar o ativo do painel global.
    /// </remarks>
    [HttpDelete("{ticker}")]
    [ProducesResponseType(200)]
    public async Task<IActionResult> RemoveFavorito(string ticker)
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdClaim, out int usuarioId))
            return Unauthorized();

        var favorito = await _context.Favoritos
            .FirstOrDefaultAsync(f => f.UsuarioId == usuarioId && f.Ticker == ticker);

        if (favorito == null)
            return NotFound();

        var vinculos = await _context.WatchlistAbaFavoritos
            .Where(v => v.FavoritoId == favorito.Id)
            .ToListAsync();
        if (vinculos.Count > 0)
            _context.WatchlistAbaFavoritos.RemoveRange(vinculos);

        _context.Favoritos.Remove(favorito);
        await _context.SaveChangesAsync();

        return Ok(new { mensagem = "Removido da watchlist!" });
    }
}

public class FavoritoDto
{
    /// <summary>
    /// Código do ativo na bolsa.
    /// </summary>
    /// <example>ITUB4</example>
    public string Ticker { get; set; } = string.Empty;

    /// <summary>
    /// Nome da empresa.
    /// </summary>
    /// <example>Itaú Unibanco</example>
    public string? NomeEmpresa { get; set; }
    public string? Categoria { get; set; }
    public string? Rentabilidade { get; set; }
    public string? NomeCarteira { get; set; }
}

public class AnotacaoDto
{
    /// <summary>
    /// Lembrete pessoal sobre o ativo.
    /// </summary>
    /// <example>Aguardar balanço do 3T26 para comprar.</example>
    public string? Anotacao { get; set; }
}