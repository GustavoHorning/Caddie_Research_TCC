using Microsoft.EntityFrameworkCore;
using CaddieResearch.Api.Data;
using CaddieResearch.Api.Models;
using CaddieResearch.Api.DTOs.Watchlist;
using CaddieResearch.Api.Interfaces;

namespace CaddieResearch.Api.Services;

public class WatchlistAbasService : IWatchlistAbasService
{
    private readonly AppDbContext _context;

    public WatchlistAbasService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<WatchlistAbaResultDto>> ObterAbasAsync(int usuarioId)
    {
        return await _context.WatchlistAbas
            .Where(a => a.UsuarioId == usuarioId)
            .OrderBy(a => a.DataCriacao)
            .Select(a => new WatchlistAbaResultDto
            {
                Id = a.Id,
                Nome = a.Nome,
                DataCriacao = a.DataCriacao,
                Tickers = a.Itens.Select(i => i.Favorito!.Ticker).ToList()
            })
            .ToListAsync();
    }

    public async Task<(bool Sucesso, string Mensagem, WatchlistAbaResultDto? Aba)> CriarAbaAsync(int usuarioId, CriarAbaRequestDto dto)
    {
        var nomeLimpo = dto.Nome.Trim();
        
        var jaExiste = await _context.WatchlistAbas
            .AnyAsync(a => a.UsuarioId == usuarioId && a.Nome.ToLower() == nomeLimpo.ToLower());
            
        if (jaExiste)
            return (false, "Você já tem uma aba com esse nome.", null);

        var aba = new WatchlistAba
        {
            UsuarioId = usuarioId,
            Nome = nomeLimpo
        };

        _context.WatchlistAbas.Add(aba);
        await _context.SaveChangesAsync();

        var abaResult = new WatchlistAbaResultDto
        {
            Id = aba.Id,
            Nome = aba.Nome,
            DataCriacao = aba.DataCriacao,
            Tickers = new List<string>()
        };

        return (true, "Aba criada com sucesso.", abaResult);
    }

    public async Task<bool> ExcluirAbaAsync(int abaId, int usuarioId)
    {
        var aba = await _context.WatchlistAbas
            .FirstOrDefaultAsync(a => a.Id == abaId && a.UsuarioId == usuarioId);

        if (aba == null) return false;

        _context.WatchlistAbas.Remove(aba);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<(bool Sucesso, string Mensagem)> AdicionarFavoritoNaAbaAsync(int abaId, string ticker, int usuarioId)
    {
        var aba = await _context.WatchlistAbas.FirstOrDefaultAsync(a => a.Id == abaId && a.UsuarioId == usuarioId);
        if (aba == null) return (false, "Aba não encontrada.");

        var favorito = await _context.Favoritos.FirstOrDefaultAsync(f => f.UsuarioId == usuarioId && f.Ticker == ticker);
        if (favorito == null) return (false, "Ativo não está na sua watchlist.");

        var jaEsta = await _context.WatchlistAbaFavoritos.AnyAsync(i => i.WatchlistAbaId == abaId && i.FavoritoId == favorito.Id);
        if (jaEsta) return (false, "Esse ativo já está nessa aba.");

        _context.WatchlistAbaFavoritos.Add(new WatchlistAbaFavorito
        {
            WatchlistAbaId = abaId,
            FavoritoId = favorito.Id
        });
        await _context.SaveChangesAsync();

        return (true, "Adicionado à aba!");
    }

    public async Task<bool> RemoverFavoritoDaAbaAsync(int abaId, string ticker, int usuarioId)
    {
        var aba = await _context.WatchlistAbas.FirstOrDefaultAsync(a => a.Id == abaId && a.UsuarioId == usuarioId);
        if (aba == null) return false;

        var favorito = await _context.Favoritos.FirstOrDefaultAsync(f => f.UsuarioId == usuarioId && f.Ticker == ticker);
        if (favorito == null) return false;

        var item = await _context.WatchlistAbaFavoritos
            .FirstOrDefaultAsync(i => i.WatchlistAbaId == abaId && i.FavoritoId == favorito.Id);
        if (item == null) return false;

        _context.WatchlistAbaFavoritos.Remove(item);
        await _context.SaveChangesAsync();
        
        return true;
    }
}