using Microsoft.EntityFrameworkCore;
using CaddieResearch.Api.Data;
using CaddieResearch.Api.Models;
using CaddieResearch.Api.DTOs.Portfolio;
using CaddieResearch.Api.Interfaces;

namespace CaddieResearch.Api.Services;

public class PortfolioService : IPortfolioService
{
    private readonly AppDbContext _context;

    public PortfolioService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<PortfolioResultDto>> GetPortfoliosAsync(int usuarioId)
    {
        var portfolios = await _context.Portfolios
            .Where(p => p.UsuarioId == usuarioId)
            .Include(p => p.Posicoes)
            .ToListAsync();

        var portfolioIds = portfolios.Select(p => p.Id).ToList();
        var aportesPorPortfolio = await _context.Aportes
            .Where(a => portfolioIds.Contains(a.PortfolioId))
            .GroupBy(a => a.PortfolioId)
            .Select(g => new { PortfolioId = g.Key, Total = g.Sum(a => a.Valor) })
            .ToDictionaryAsync(x => x.PortfolioId, x => x.Total);

        return portfolios.Select(p =>
        {
            // CORREÇÃO: Restaurado o asterisco da multiplicação que o Git mastigou
            var valorPosicoes = p.Posicoes?.Sum(pos => pos.Quantidade * pos.PrecoMedio) ?? 0;
            var totalAportes = aportesPorPortfolio.GetValueOrDefault(p.Id, 0);
            var temPosicoes = (p.Posicoes?.Count ?? 0) > 0;

            var patrimonio = temPosicoes ? valorPosicoes : totalAportes;

            return new PortfolioResultDto
            {
                Id = p.Id,
                Nome = p.Nome,
                DataInicio = p.DataInicio,
                Patrimonio = patrimonio,
                TotalPosicoes = p.Posicoes?.Count ?? 0,
                TemContaCorrente = !temPosicoes && totalAportes > 0,
                TotalAportes = totalAportes
            };
        });
    }

    public async Task<PortfolioDetalheResultDto?> GetPortfolioAsync(int id, int usuarioId)
    {
        var portfolio = await _context.Portfolios
            .Include(p => p.Usuario)
            .Include(p => p.Posicoes)
            .FirstOrDefaultAsync(p => p.Id == id && p.UsuarioId == usuarioId);

        if (portfolio == null) return null;

        return new PortfolioDetalheResultDto
        {
            Id = portfolio.Id,
            Nome = portfolio.Nome,
            DataInicio = portfolio.DataInicio,
            NomeCliente = portfolio.Usuario?.Nome,
            Posicoes = portfolio.Posicoes?.Select(pos => new PosicaoResultDto
            {
                Id = pos.Id,
                Ticker = pos.Ticker,
                NomeAtivo = pos.NomeAtivo,
                ClasseAtivo = pos.ClasseAtivo, // CORREÇÃO: Propriedade agora existe no DTO
                Quantidade = pos.Quantidade,
                PrecoMedio = pos.PrecoMedio,
                DataEntrada = pos.DataEntrada,
                ValorTotal = pos.Quantidade * pos.PrecoMedio // CORREÇÃO: Multiplicação
            }).ToList() ?? new List<PosicaoResultDto>()
        };
    }

    public async Task<PortfolioResultDto> CriarPortfolioAsync(int usuarioId, CriarPortfolioRequestDto req)
    {
        var portfolio = new Portfolio
        {
            UsuarioId = usuarioId,
            Nome = req.Nome,
            DataInicio = req.DataInicio ?? DateTime.UtcNow
        };
        
        _context.Portfolios.Add(portfolio);
        await _context.SaveChangesAsync(); 

        if (req.AporteInicial.HasValue && req.AporteInicial.Value > 0)
        {
            _context.Aportes.Add(new Aporte
            {
                PortfolioId = portfolio.Id,
                Valor = req.AporteInicial.Value,
                Descricao = "Aporte inicial",
                DataAporte = req.DataInicio ?? DateTime.UtcNow,
                DataRegistro = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();
        }

        return new PortfolioResultDto
        {
            Id = portfolio.Id,
            Nome = portfolio.Nome,
            DataInicio = portfolio.DataInicio,
            Patrimonio = req.AporteInicial ?? 0,
            TotalAportes = req.AporteInicial ?? 0
        };
    }

    public async Task<PosicaoResultDto?> AdicionarPosicaoAsync(int portfolioId, int usuarioId, PosicaoRequestDto dto)
    {
        var portfolio = await _context.Portfolios
            .FirstOrDefaultAsync(p => p.Id == portfolioId && p.UsuarioId == usuarioId);

        if (portfolio == null) return null;

        var posicao = new Posicao
        {
            PortfolioId = portfolioId,
            Ticker = dto.Ticker.ToUpper(),
            NomeAtivo = dto.NomeAtivo,
            ClasseAtivo = dto.ClasseAtivo,
            Quantidade = dto.Quantidade,
            PrecoMedio = dto.PrecoMedio,
            DataEntrada = dto.DataEntrada ?? DateTime.UtcNow
        };

        _context.Posicoes.Add(posicao);
        await _context.SaveChangesAsync();

        return new PosicaoResultDto
        {
            Id = posicao.Id,
            Ticker = posicao.Ticker,
            NomeAtivo = posicao.NomeAtivo,
            ClasseAtivo = posicao.ClasseAtivo,
            Quantidade = posicao.Quantidade,
            PrecoMedio = posicao.PrecoMedio,
            DataEntrada = posicao.DataEntrada,
            ValorTotal = posicao.Quantidade * posicao.PrecoMedio // CORREÇÃO: Multiplicação
        };
    }

    public async Task<bool> RemoverPosicaoAsync(int portfolioId, int posicaoId, int usuarioId)
    {
        var posicao = await _context.Posicoes
            .Include(p => p.Portfolio)
            .FirstOrDefaultAsync(p => p.Id == posicaoId && p.Portfolio!.UsuarioId == usuarioId && p.PortfolioId == portfolioId);

        if (posicao == null) return false;

        _context.Posicoes.Remove(posicao);
        await _context.SaveChangesAsync();
        return true;
    }
}