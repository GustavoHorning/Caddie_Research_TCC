using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CaddieResearch.Api.Data;
using CaddieResearch.Api.Models;

namespace CaddieResearch.Api.Controllers;

[ApiController]
[Route("api/watchlist-abas")]
[Authorize]
public class WatchlistAbasController : ControllerBase
{
    private readonly AppDbContext _context;

    public WatchlistAbasController(AppDbContext context)
    {
        _context = context;
    }

    private int GetUsuarioId()
    {
        var claim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(claim, out int id) ? id : 0;
    }

    // Lista as abas do usuário logado, cada uma já com a lista de tickers que ela contém
    [HttpGet]
    public async Task<IActionResult> GetAbas()
    {
        var usuarioId = GetUsuarioId();
        if (usuarioId == 0) return Unauthorized();

        var abas = await _context.WatchlistAbas
            .Where(a => a.UsuarioId == usuarioId)
            .OrderBy(a => a.DataCriacao)
            .Select(a => new
            {
                a.Id,
                a.Nome,
                a.DataCriacao,
                Tickers = a.Itens.Select(i => i.Favorito!.Ticker).ToList()
            })
            .ToListAsync();

        return Ok(abas);
    }

    // Cria uma aba nova para o usuário logado
    [HttpPost]
    public async Task<IActionResult> CriarAba([FromBody] CriarAbaDto dto)
    {
        var usuarioId = GetUsuarioId();
        if (usuarioId == 0) return Unauthorized();

        if (string.IsNullOrWhiteSpace(dto.Nome))
            return BadRequest(new { mensagem = "O nome da aba é obrigatório." });

        var nomeLimpo = dto.Nome.Trim();
        if (nomeLimpo.Length > 50)
            return BadRequest(new { mensagem = "O nome da aba deve ter até 50 caracteres." });

        var jaExiste = await _context.WatchlistAbas
            .AnyAsync(a => a.UsuarioId == usuarioId && a.Nome.ToLower() == nomeLimpo.ToLower());
        if (jaExiste)
            return BadRequest(new { mensagem = "Você já tem uma aba com esse nome." });

        var aba = new WatchlistAba
        {
            UsuarioId = usuarioId,
            Nome = nomeLimpo
        };

        _context.WatchlistAbas.Add(aba);
        await _context.SaveChangesAsync();

        return Ok(new { aba.Id, aba.Nome, aba.DataCriacao, Tickers = new List<string>() });
    }

    // Exclui uma aba do usuário logado. Os favoritos em si NÃO são apagados, só saem da aba.
    [HttpDelete("{id}")]
    public async Task<IActionResult> ExcluirAba(int id)
    {
        var usuarioId = GetUsuarioId();
        if (usuarioId == 0) return Unauthorized();

        var aba = await _context.WatchlistAbas
            .FirstOrDefaultAsync(a => a.Id == id && a.UsuarioId == usuarioId);

        if (aba == null) return NotFound();

        _context.WatchlistAbas.Remove(aba);
        await _context.SaveChangesAsync();

        return Ok(new { mensagem = "Aba excluída." });
    }

    // Adiciona um favorito (pelo ticker) a uma aba do usuário logado
    [HttpPost("{id}/favoritos/{ticker}")]
    public async Task<IActionResult> AdicionarFavoritoNaAba(int id, string ticker)
    {
        var usuarioId = GetUsuarioId();
        if (usuarioId == 0) return Unauthorized();

        var aba = await _context.WatchlistAbas
            .FirstOrDefaultAsync(a => a.Id == id && a.UsuarioId == usuarioId);
        if (aba == null) return NotFound(new { mensagem = "Aba não encontrada." });

        var favorito = await _context.Favoritos
            .FirstOrDefaultAsync(f => f.UsuarioId == usuarioId && f.Ticker == ticker);
        if (favorito == null) return NotFound(new { mensagem = "Ativo não está na sua watchlist." });

        var jaEsta = await _context.WatchlistAbaFavoritos
            .AnyAsync(i => i.WatchlistAbaId == id && i.FavoritoId == favorito.Id);
        if (jaEsta)
            return BadRequest(new { mensagem = "Esse ativo já está nessa aba." });

        _context.WatchlistAbaFavoritos.Add(new WatchlistAbaFavorito
        {
            WatchlistAbaId = id,
            FavoritoId = favorito.Id
        });
        await _context.SaveChangesAsync();

        return Ok(new { mensagem = "Adicionado à aba!" });
    }

    // Remove um favorito (pelo ticker) de uma aba do usuário logado
    [HttpDelete("{id}/favoritos/{ticker}")]
    public async Task<IActionResult> RemoverFavoritoDaAba(int id, string ticker)
    {
        var usuarioId = GetUsuarioId();
        if (usuarioId == 0) return Unauthorized();

        var aba = await _context.WatchlistAbas
            .FirstOrDefaultAsync(a => a.Id == id && a.UsuarioId == usuarioId);
        if (aba == null) return NotFound();

        var favorito = await _context.Favoritos
            .FirstOrDefaultAsync(f => f.UsuarioId == usuarioId && f.Ticker == ticker);
        if (favorito == null) return NotFound();

        var item = await _context.WatchlistAbaFavoritos
            .FirstOrDefaultAsync(i => i.WatchlistAbaId == id && i.FavoritoId == favorito.Id);
        if (item == null) return NotFound();

        _context.WatchlistAbaFavoritos.Remove(item);
        await _context.SaveChangesAsync();

        return Ok(new { mensagem = "Removido da aba." });
    }
}

public class CriarAbaDto
{
    public string Nome { get; set; } = string.Empty;
}