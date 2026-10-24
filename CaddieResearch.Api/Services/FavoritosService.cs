using CaddieResearch.Api.Data;
using CaddieResearch.Api.Models;
using CaddieResearch.Api.DTOs.Favoritos;
using CaddieResearch.Api.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace CaddieResearch.Api.Services;

public class FavoritosService : IFavoritosService
{
    private readonly AppDbContext _context;

    public FavoritosService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<FavoritoResultDto>> ObterFavoritosAsync(int usuarioId)
    {
        return await _context.Favoritos
            .Where(f => f.UsuarioId == usuarioId)
            .OrderByDescending(f => f.DataAdicionado)
            .Select(f => new FavoritoResultDto
            {
                Id = f.Id,
                Ticker = f.Ticker,
                NomeEmpresa = f.NomeEmpresa,
                Categoria = f.Categoria,
                Rentabilidade = f.Rentabilidade,
                NomeCarteira = f.NomeCarteira,
                Anotacao = f.Anotacao,
                DataAdicionado = f.DataAdicionado
            })
            .ToListAsync();
    }

    public async Task<(bool Sucesso, string Mensagem)> AdicionarFavoritoAsync(int usuarioId, FavoritoDto dto)
    {
        var jaExiste = await _context.Favoritos
            .AnyAsync(f => f.UsuarioId == usuarioId && f.Ticker == dto.Ticker);

        if (jaExiste)
            return (false, "Ativo já está na watchlist.");

        var favorito = new Favorito
        {
            UsuarioId = usuarioId,
            Ticker = dto.Ticker,
            NomeEmpresa = dto.NomeEmpresa,
            Categoria = dto.Categoria,
            Rentabilidade = dto.Rentabilidade,
            NomeCarteira = dto.NomeCarteira,
            DataAdicionado = DateTime.UtcNow
        };

        _context.Favoritos.Add(favorito);
        await _context.SaveChangesAsync();

        return (true, "Adicionado à watchlist!");
    }

    public async Task<(bool Sucesso, string Mensagem)> AtualizarAnotacaoAsync(int usuarioId, string ticker, AnotacaoDto dto)
    {
        var favorito = await _context.Favoritos
            .FirstOrDefaultAsync(f => f.UsuarioId == usuarioId && f.Ticker == ticker);

        if (favorito == null)
            return (false, "Ativo não encontrado na watchlist.");

        favorito.Anotacao = dto.Anotacao;
        await _context.SaveChangesAsync();

        return (true, "Anotação salva!");
    }

    public async Task<(bool Sucesso, string Mensagem)> RemoverFavoritoAsync(int usuarioId, string ticker)
    {
        var favorito = await _context.Favoritos
            .FirstOrDefaultAsync(f => f.UsuarioId == usuarioId && f.Ticker == ticker);

        if (favorito == null)
            return (false, "Ativo não encontrado na watchlist.");

        // Regra importante de deleção em cascata manual
        var vinculos = await _context.WatchlistAbaFavoritos
            .Where(v => v.FavoritoId == favorito.Id)
            .ToListAsync();
            
        if (vinculos.Any())
            _context.WatchlistAbaFavoritos.RemoveRange(vinculos);

        _context.Favoritos.Remove(favorito);
        await _context.SaveChangesAsync();

        return (true, "Removido da watchlist!");
    }
}