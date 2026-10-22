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

    /// <summary>
    /// Lista as recomendações enviadas para o cliente logado.
    /// </summary>
    /// <remarks>
    /// Retorna a caixa de entrada de dicas de investimento recebidas dos gestores, ordenadas da mais recente para a mais antiga.
    /// </remarks>
    /// <response code="200">Lista carregada com sucesso.</response>
    /// <response code="401">Usuário não autenticado.</response>
    [HttpGet("minhas")]
    [ProducesResponseType(200)]
    [ProducesResponseType(401)]
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

    /// <summary>
    /// Lista todas as recomendações já emitidas pelo Gestor logado.
    /// </summary>
    [HttpGet("enviadas")]
    [ProducesResponseType(200)]
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

    /// <summary>
    /// Cria e envia uma nova recomendação direta a um cliente (Acesso Gestor).
    /// </summary>
    /// <remarks>
    /// Registra a indicação de compra (ou alerta) que ficará pendente de aprovação (Aceite/Recusa) pelo cliente destinatário.
    /// </remarks>
    [HttpPost]
    [ProducesResponseType(200)]
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

    /// <summary>
    /// Aceita uma recomendação recebida, transformando-a em posição na carteira.
    /// </summary>
    /// <remarks>
    /// Ao aderir à recomendação, o status é alterado para "Aceita" e o ativo é automaticamente injetado como uma nova posição de compra no Portfólio do cliente, utilizando o preço e a quantidade sugeridos.
    /// </remarks>
    /// <param name="id">ID numérico da recomendação.</param>
    /// <response code="200">Recomendação aceita e convertida em posição com sucesso.</response>
    /// <response code="400">Recomendação já foi respondida ou o cliente não tem portfólio ativo.</response>
    [HttpPost("{id}/aderir")]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
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

    /// <summary>
    /// Recusa uma recomendação de investimento.
    /// </summary>
    /// <remarks>
    /// Muda o status do card para "Recusada" a fim de manter o histórico documentado para o gestor. Nenhuma alteração financeira é feita na carteira.
    /// </remarks>
    [HttpPost("{id}/recusar")]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
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

    /// <summary>
    /// Retorna a lista de clientes aptos a receber recomendações.
    /// </summary>
    [HttpGet("clientes")]
    [ProducesResponseType(200)]
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
    /// <summary>
    /// ID do cliente destinatário.
    /// </summary>
    /// <example>15</example>
    public int ClienteId { get; set; }

    /// <summary>
    /// Código de negociação do ativo.
    /// </summary>
    /// <example>WEGE3</example>
    public string Ticker { get; set; } = string.Empty;

    public string NomeAtivo { get; set; } = string.Empty;
    public string ClasseAtivo { get; set; } = "Renda Variável";
    public decimal Quantidade { get; set; }

    /// <summary>
    /// Preço unitário sugerido para entrada na posição.
    /// </summary>
    /// <example>48.50</example>
    public decimal PrecoSugerido { get; set; }

    /// <summary>
    /// Racional de investimento ou tese do analista.
    /// </summary>
    /// <example>Empresa com lucros sólidos e alta previsibilidade de dividendos no 4T.</example>
    public string? Descricao { get; set; }
    
    public string? Origem { get; set; }
}