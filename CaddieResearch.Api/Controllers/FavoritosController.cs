using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using CaddieResearch.Api.Data;
using CaddieResearch.Api.Models;
using CaddieResearch.Api.DTOs.Favoritos; 
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

    private int ObterUsuarioLogadoId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(userIdClaim, out int id) ? id : 0;
    }

    [HttpGet]
    public async Task<IActionResult> GetFavoritos()
    {
        int usuarioId = ObterUsuarioLogadoId();
        if (usuarioId == 0) return Unauthorized();

        var favoritos = await _context.Favoritos
            .Where(f => f.UsuarioId == usuarioId)
            .OrderByDescending(f => f.DataAdicionado)
            .ToListAsync();

        return Ok(favoritos);
    }

    [HttpPost]
    public async Task<IActionResult> AddFavorito([FromBody] FavoritoDto dto)
    {
        int usuarioId = ObterUsuarioLogadoId();
        if (usuarioId == 0) return Unauthorized();

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
        int usuarioId = ObterUsuarioLogadoId();
        if (usuarioId == 0) return Unauthorized();

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
        int usuarioId = ObterUsuarioLogadoId();
        if (usuarioId == 0) return Unauthorized();

        var favorito = await _context.Favoritos
            .FirstOrDefaultAsync(f => f.UsuarioId == usuarioId && f.Ticker == ticker);

        if (favorito == null)
            return NotFound();

        var vinculos = await _context.WatchlistAbaFavoritos
            .Where(v => v.FavoritoId == favorito.Id)
            .ToListAsync();
            
        if (vinculos.Any())
            _context.WatchlistAbaFavoritos.RemoveRange(vinculos);

        _context.Favoritos.Remove(favorito);
        await _context.SaveChangesAsync();

        return Ok(new { mensagem = "Removido da watchlist!" });
    }
}