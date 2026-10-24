using CaddieResearch.Api.Data;
using CaddieResearch.Api.Models;
using CaddieResearch.Api.DTOs.Portfolio;
using CaddieResearch.Api.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace CaddieResearch.Api.Services;

public class AportesService : IAportesService
{
    private readonly AppDbContext _context;

    public AportesService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<(bool Sucesso, string Mensagem, List<AporteResultDto>? Aportes)> ObterAportesAsync(int portfolioId, int usuarioId)
    {
        var pertence = await _context.Portfolios.AnyAsync(p => p.Id == portfolioId && p.UsuarioId == usuarioId);
        if (!pertence) 
            return (false, "Portfólio não encontrado ou acesso negado.", null);

        var aportes = await _context.Aportes
            .Where(a => a.PortfolioId == portfolioId)
            .OrderByDescending(a => a.DataAporte)
            .Select(a => new AporteResultDto
            {
                Id = a.Id,
                PortfolioId = a.PortfolioId,
                Valor = a.Valor,
                Descricao = a.Descricao,
                DataAporte = a.DataAporte,
                DataRegistro = a.DataRegistro
            })
            .ToListAsync();

        return (true, string.Empty, aportes);
    }

    public async Task<(bool Sucesso, string Mensagem, AporteResultDto? Aporte)> CadastrarAporteAsync(int portfolioId, int usuarioId, AporteRequestDto dto)
    {
        var pertence = await _context.Portfolios.AnyAsync(p => p.Id == portfolioId && p.UsuarioId == usuarioId);
        if (!pertence) 
            return (false, "Portfólio não encontrado ou acesso negado.", null);

        var aporte = new Aporte
        {
            PortfolioId = portfolioId,
            Valor = dto.Valor,
            Descricao = dto.Descricao,
            DataAporte = dto.DataAporte ?? DateTime.UtcNow,
            DataRegistro = DateTime.UtcNow
        };

        _context.Aportes.Add(aporte);
        await _context.SaveChangesAsync();

        var resultado = new AporteResultDto
        {
            Id = aporte.Id,
            PortfolioId = aporte.PortfolioId,
            Valor = aporte.Valor,
            Descricao = aporte.Descricao,
            DataAporte = aporte.DataAporte,
            DataRegistro = aporte.DataRegistro
        };

        return (true, string.Empty, resultado);
    }

    public async Task<(bool Sucesso, string Mensagem)> RemoverAporteAsync(int portfolioId, int id, int usuarioId)
    {
        var aporte = await _context.Aportes
            .Include(a => a.Portfolio)
            .FirstOrDefaultAsync(a => a.Id == id && a.PortfolioId == portfolioId && a.Portfolio!.UsuarioId == usuarioId);

        if (aporte == null) 
            return (false, "Aporte não encontrado ou acesso negado.");

        _context.Aportes.Remove(aporte);
        await _context.SaveChangesAsync();
        
        return (true, string.Empty);
    }
}