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

    [HttpGet]
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

    [HttpPost]
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

    [HttpPatch("{ticker}/anotacao")]
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

    [HttpDelete("{ticker}")]
    public async Task<IActionResult> RemoveFavorito(string ticker)
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdClaim, out int usuarioId))
            return Unauthorized();

        var favorito = await _context.Favoritos
            .FirstOrDefaultAsync(f => f.UsuarioId == usuarioId && f.Ticker == ticker);

        if (favorito == null)
            return NotFound();

        _context.Favoritos.Remove(favorito);
        await _context.SaveChangesAsync();

        return Ok(new { mensagem = "Removido da watchlist!" });
    }
}

public class FavoritoDto
{
    public string Ticker { get; set; } = string.Empty;
    public string? NomeEmpresa { get; set; }
    public string? Categoria { get; set; }
    public string? Rentabilidade { get; set; }
    public string? NomeCarteira { get; set; }
}

public class AnotacaoDto
{
    public string? Anotacao { get; set; }
}