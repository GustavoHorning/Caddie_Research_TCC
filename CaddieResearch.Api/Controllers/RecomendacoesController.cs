using CaddieResearch.Api.Data;
using CaddieResearch.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace CaddieResearch.Api.Controllers;

[Route("api/recomendacoes")]
[ApiController]
[Authorize]
public class RecomendacoesController : ControllerBase
{
    private readonly AppDbContext _context;

    public RecomendacoesController(AppDbContext context)
    {
        _context = context;
    }

    private int GetUsuarioId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(claim, out int id) ? id : 0;
    }

    private string GetRole() =>
        User.FindFirst("http://schemas.microsoft.com/ws/2008/06/identity/claims/role")?.Value
        ?? User.FindFirst(ClaimTypes.Role)?.Value ?? "";

    // Cliente: listar recomendações recebidas
    [HttpGet("minhas")]
    public async Task<IActionResult> GetMinhas()
    {
        var usuarioId = GetUsuarioId();
        if (usuarioId == 0) return Unauthorized();

        var recomendacoes = await _context.Recomendacoes
            .Include(r => r.Gestor)
            .Where(r => r.ClienteId == usuarioId)
            .OrderByDescending(r => r.DataCriacao)
            .Select(r => new {
                r.Id, r.Ticker, r.NomeAtivo, r.ClasseAtivo,
                r.Quantidade, r.PrecoSugerido, r.Descricao,
                r.Origem, r.Status, r.DataCriacao, r.DataResposta,
                r.PortfolioId,
                NomeGestor = r.Gestor!.Nome
            })
            .ToListAsync();

        return Ok(recomendacoes);
    }

    // Gestor: listar recomendações enviadas
    [HttpGet("enviadas")]
    public async Task<IActionResult> GetEnviadas()
    {
        var usuarioId = GetUsuarioId();
        if (usuarioId == 0) return Unauthorized();

        var recomendacoes = await _context.Recomendacoes
            .Include(r => r.Cliente)
            .Where(r => r.GestorId == usuarioId)
            .OrderByDescending(r => r.DataCriacao)
            .Select(r => new {
                r.Id, r.Ticker, r.NomeAtivo, r.ClasseAtivo,
                r.Quantidade, r.PrecoSugerido, r.Descricao,
                r.Origem, r.Status, r.DataCriacao, r.DataResposta,
                r.PortfolioId,
                NomeCliente = r.Cliente!.Nome
            })
            .ToListAsync();

        return Ok(recomendacoes);
    }

    // Gestor: criar recomendação
    [HttpPost]
    public async Task<IActionResult> Criar([FromBody] RecomendacaoDto dto)
    {
        var gestorId = GetUsuarioId();
        if (gestorId == 0) return Unauthorized();

        // Buscar portfólio do cliente
        var portfolio = await _context.Portfolios
            .FirstOrDefaultAsync(p => p.UsuarioId == dto.ClienteId);

        var recomendacao = new Recomendacao
        {
            GestorId = gestorId,
            ClienteId = dto.ClienteId,
            PortfolioId = portfolio?.Id,
            Ticker = dto.Ticker.ToUpper(),
            NomeAtivo = dto.NomeAtivo,
            ClasseAtivo = dto.ClasseAtivo,
            Quantidade = dto.Quantidade,
            PrecoSugerido = dto.PrecoSugerido,
            Descricao = dto.Descricao,
            Origem = dto.Origem ?? "Painel",
            Status = "Pendente",
            DataCriacao = DateTime.UtcNow
        };

        _context.Recomendacoes.Add(recomendacao);
        await _context.SaveChangesAsync();
        return Ok(recomendacao);
    }

    // Cliente: aderir à recomendação → cria posição no portfólio
    [HttpPost("{id}/aderir")]
    public async Task<IActionResult> Aderir(int id)
    {
        var clienteId = GetUsuarioId();
        if (clienteId == 0) return Unauthorized();

        var rec = await _context.Recomendacoes
            .FirstOrDefaultAsync(r => r.Id == id && r.ClienteId == clienteId);

        if (rec == null) return NotFound();
        if (rec.Status != "Pendente") return BadRequest(new { erro = "Recomendação já foi respondida." });

        // Buscar portfólio do cliente
        var portfolio = await _context.Portfolios
            .FirstOrDefaultAsync(p => p.UsuarioId == clienteId);

        if (portfolio == null) return BadRequest(new { erro = "Nenhum portfólio encontrado." });

        // Criar posição
        var posicao = new Posicao
        {
            PortfolioId = portfolio.Id,
            Ticker = rec.Ticker,
            NomeAtivo = rec.NomeAtivo,
            ClasseAtivo = rec.ClasseAtivo,
            Quantidade = rec.Quantidade,
            PrecoMedio = rec.PrecoSugerido,
            DataEntrada = DateTime.UtcNow
        };

        _context.Posicoes.Add(posicao);

        rec.Status = "Aceita";
        rec.DataResposta = DateTime.UtcNow;
        rec.PortfolioId = portfolio.Id;

        await _context.SaveChangesAsync();
        return Ok(new { mensagem = "Posição adicionada ao portfólio!", posicao });
    }

    // Cliente: recusar recomendação
    [HttpPost("{id}/recusar")]
    public async Task<IActionResult> Recusar(int id)
    {
        var clienteId = GetUsuarioId();
        if (clienteId == 0) return Unauthorized();

        var rec = await _context.Recomendacoes
            .FirstOrDefaultAsync(r => r.Id == id && r.ClienteId == clienteId);

        if (rec == null) return NotFound();
        if (rec.Status != "Pendente") return BadRequest(new { erro = "Recomendação já foi respondida." });

        rec.Status = "Recusada";
        rec.DataResposta = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return Ok(new { mensagem = "Recomendação recusada." });
    }

    // Gestor: listar clientes para enviar recomendação
    [HttpGet("clientes")]
    public async Task<IActionResult> GetClientes()
    {
        var clientes = await _context.Usuarios
            .Where(u => u.TipoPerfil == "Assinante")
            .Select(u => new { u.Id, u.Nome, u.Email })
            .ToListAsync();
        return Ok(clientes);
    }
}

public class RecomendacaoDto
{
    public int ClienteId { get; set; }
    public string Ticker { get; set; } = string.Empty;
    public string NomeAtivo { get; set; } = string.Empty;
    public string ClasseAtivo { get; set; } = "Renda Variável";
    public decimal Quantidade { get; set; }
    public decimal PrecoSugerido { get; set; }
    public string? Descricao { get; set; }
    public string? Origem { get; set; }
}
