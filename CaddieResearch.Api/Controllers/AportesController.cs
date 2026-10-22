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

    /// <summary>
    /// Retorna a lista de aportes de um portfólio.
    /// </summary>
    /// <remarks>
    /// Consulta o banco de dados e retorna o histórico financeiro de injeção de capital (aportes) ordenados da data mais recente para a mais antiga.
    /// </remarks>
    /// <param name="portfolioId">ID do portfólio do cliente.</param>
    /// <response code="200">Lista retornada com sucesso.</response>
    /// <response code="401">Usuário não autenticado.</response>
    /// <response code="403">O usuário não tem permissão para acessar este portfólio.</response>
    [HttpGet]
    [ProducesResponseType(200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
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

    /// <summary>
    /// Cria um novo aporte no portfólio.
    /// </summary>
    /// <remarks>
    /// Registra uma nova entrada de dinheiro na carteira do cliente, impactando no saldo total e nos cálculos de rentabilidade patrimonial.
    /// </remarks>
    /// <param name="portfolioId">ID do portfólio do cliente.</param>
    /// <response code="200">Aporte registrado com sucesso.</response>
    /// <response code="401">Usuário não autenticado.</response>
    /// <response code="403">Acesso negado ao portfólio informado.</response>
    [HttpPost]
    [ProducesResponseType(200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
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

    /// <summary>
    /// Exclui um aporte do portfólio.
    /// </summary>
    /// <remarks>
    /// Remove o registro de injeção de capital de forma permanente, ajustando o saldo consolidado do cliente.
    /// </remarks>
    /// <param name="portfolioId">ID do portfólio.</param>
    /// <param name="id">ID do aporte a ser excluído.</param>
    /// <response code="204">Aporte excluído com sucesso.</response>
    /// <response code="401">Usuário não autenticado.</response>
    /// <response code="404">Aporte não encontrado neste portfólio.</response>
    [HttpDelete("{id}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(401)]
    [ProducesResponseType(404)]
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
    /// <summary>
    /// Valor financeiro do aporte.
    /// </summary>
    /// <example>1500.00</example>
    public decimal Valor { get; set; }

    /// <summary>
    /// Descrição opcional (ex: Origem do dinheiro ou meta).
    /// </summary>
    /// <example>Aporte mensal (Outubro)</example>
    public string? Descricao { get; set; }

    /// <summary>
    /// Data em que o aporte foi efetivado.
    /// </summary>
    /// <example>2026-10-22T09:00:00Z</example>
    public DateTime? DataAporte { get; set; }
}