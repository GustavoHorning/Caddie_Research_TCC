using CaddieResearch.Api.Data;
using CaddieResearch.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace CaddieResearch.Api.Controllers;

[Route("api/portfolio/{portfolioId:int}/aportes")]
[ApiController]
[Authorize]
public class AportesController : ControllerBase
{
    private readonly AppDbContext _context;

    public AportesController(AppDbContext context)
    {
        _context = context;
    }

    private int GetUsuarioId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(claim, out int id) ? id : 0;
    }

    [HttpGet]
    public async Task<IActionResult> GetAportes(int portfolioId)
    {
        var usuarioId = GetUsuarioId();
        if (usuarioId == 0) return Unauthorized();

        var pertence = await _context.Portfolios
            .AnyAsync(p => p.Id == portfolioId && p.UsuarioId == usuarioId);
        if (!pertence) return Forbid();

        var aportes = await _context.Aportes
            .Where(a => a.PortfolioId == portfolioId)
            .OrderByDescending(a => a.DataAporte)
            .ToListAsync();

        return Ok(aportes);
    }

    [HttpPost]
    public async Task<IActionResult> CadastrarAporte(int portfolioId, [FromBody] AporteDto dto)
    {
        var usuarioId = GetUsuarioId();
        if (usuarioId == 0) return Unauthorized();

        var pertence = await _context.Portfolios
            .AnyAsync(p => p.Id == portfolioId && p.UsuarioId == usuarioId);
        if (!pertence) return Forbid();

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
        return Ok(aporte);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> RemoverAporte(int portfolioId, int id)
    {
        var usuarioId = GetUsuarioId();
        if (usuarioId == 0) return Unauthorized();

        var aporte = await _context.Aportes
            .Include(a => a.Portfolio)
            .FirstOrDefaultAsync(a => a.Id == id && a.PortfolioId == portfolioId && a.Portfolio!.UsuarioId == usuarioId);

        if (aporte == null) return NotFound();

        _context.Aportes.Remove(aporte);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}

public class AporteDto
{
    public decimal Valor { get; set; }
    public string? Descricao { get; set; }
    public DateTime? DataAporte { get; set; }
}
