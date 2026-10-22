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

    /// <summary>
    /// Lista todas as abas personalizadas de Watchlist do usuário.
    /// </summary>
    /// <remarks>
    /// Retorna as sub-pastas (abas) organizadoras que o cliente criou e a lista de códigos (Tickers) que estão anexados dentro delas.
    /// </remarks>
    [HttpGet]
    [ProducesResponseType(200)]
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

    /// <summary>
    /// Cria uma nova sub-aba na Watchlist.
    /// </summary>
    /// <remarks>
    /// Cria um novo grupo vazio para organizar os favoritos (Ex: "Ativos Promissores", "Bancos"). Impõe restrição de 50 caracteres no nome e impede duplicidade de abas com o mesmo título.
    /// </remarks>
    [HttpPost]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
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

    /// <summary>
    /// Exclui uma aba da Watchlist (Soft Delete de Itens).
    /// </summary>
    /// <remarks>
    /// Deleta a aba organizadora. Os ativos favoritados que estavam nela não são apagados do banco, apenas perdem o vínculo com esta pasta.
    /// </remarks>
    [HttpDelete("{id}")]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]
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

    /// <summary>
    /// Vincula um ativo já favoritado a uma aba específica.
    /// </summary>
    /// <remarks>
    /// O ativo deve existir na carteira principal de Favoritos do cliente para poder ser inserido na aba.
    /// </remarks>
    [HttpPost("{id}/favoritos/{ticker}")]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
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

    /// <summary>
    /// Desvincula um ativo de uma aba específica.
    /// </summary>
    [HttpDelete("{id}/favoritos/{ticker}")]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]
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
    /// <summary>
    /// Nome da aba organizadora.
    /// </summary>
    /// <example>Pagadoras de Dividendos</example>
    public string Nome { get; set; } = string.Empty;
}