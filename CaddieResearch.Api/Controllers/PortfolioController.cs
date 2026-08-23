using CaddieResearch.Api.Data;
using CaddieResearch.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace CaddieResearch.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class PortfolioController : ControllerBase
{
    private readonly AppDbContext _context;

    public PortfolioController(AppDbContext context)
    {
        _context = context;
    }

    private int GetUsuarioId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(claim, out int id) ? id : 0;
    }

    [HttpGet]
    public async Task<IActionResult> GetPortfolios()
    {
        var usuarioId = GetUsuarioId();
        if (usuarioId == 0) return Unauthorized();

        var portfolios = await _context.Portfolios
            .Where(p => p.UsuarioId == usuarioId)
            .Include(p => p.Posicoes)
            .ToListAsync();

        var resultado = portfolios.Select(p =>
        {
            var patrimonio = p.Posicoes?.Sum(pos => pos.Quantidade * pos.PrecoMedio) ?? 0;
            return new
            {
                p.Id,
                p.Nome,
                p.DataInicio,
                Patrimonio = patrimonio,
                TotalPosicoes = p.Posicoes?.Count ?? 0
            };
        });

        return Ok(resultado);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetPortfolio(int id)
    {
        var usuarioId = GetUsuarioId();
        if (usuarioId == 0) return Unauthorized();

        var portfolio = await _context.Portfolios
            .Include(p => p.Usuario)
            .Include(p => p.Posicoes)
            .FirstOrDefaultAsync(p => p.Id == id && p.UsuarioId == usuarioId);

        if (portfolio == null) return NotFound();

        return Ok(new
        {
            portfolio.Id,
            portfolio.Nome,
            portfolio.DataInicio,
            NomeCliente = portfolio.Usuario?.Nome,
            Posicoes = portfolio.Posicoes?.Select(pos => new
            {
                pos.Id,
                pos.Ticker,
                pos.NomeAtivo,
                pos.ClasseAtivo,
                pos.Quantidade,
                pos.PrecoMedio,
                pos.DataEntrada,
                ValorTotal = pos.Quantidade * pos.PrecoMedio
            })
        });
    }

    [HttpPost("{id}/posicoes")]
    public async Task<IActionResult> AdicionarPosicao(int id, [FromBody] PosicaoDto dto)
    {
        var usuarioId = GetUsuarioId();
        if (usuarioId == 0) return Unauthorized();

        var portfolio = await _context.Portfolios
            .FirstOrDefaultAsync(p => p.Id == id && p.UsuarioId == usuarioId);

        if (portfolio == null) return NotFound();

        var posicao = new Posicao
        {
            PortfolioId = id,
            Ticker = dto.Ticker.ToUpper(),
            NomeAtivo = dto.NomeAtivo,
            ClasseAtivo = dto.ClasseAtivo,
            Quantidade = dto.Quantidade,
            PrecoMedio = dto.PrecoMedio,
            DataEntrada = dto.DataEntrada ?? DateTime.UtcNow
        };

        _context.Posicoes.Add(posicao);
        await _context.SaveChangesAsync();
        return Ok(posicao);
    }

    [HttpDelete("{portfolioId}/posicoes/{posicaoId}")]
    public async Task<IActionResult> RemoverPosicao(int portfolioId, int posicaoId)
    {
        var usuarioId = GetUsuarioId();
        if (usuarioId == 0) return Unauthorized();

        var posicao = await _context.Posicoes
            .Include(p => p.Portfolio)
            .FirstOrDefaultAsync(p => p.Id == posicaoId && p.Portfolio!.UsuarioId == usuarioId && p.PortfolioId == portfolioId);

        if (posicao == null) return NotFound();

        _context.Posicoes.Remove(posicao);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}

public class PosicaoDto
{
    public string Ticker { get; set; } = string.Empty;
    public string NomeAtivo { get; set; } = string.Empty;
    public string ClasseAtivo { get; set; } = "Renda Variável";
    public decimal Quantidade { get; set; }
    public decimal PrecoMedio { get; set; }
    public DateTime? DataEntrada { get; set; }
}
