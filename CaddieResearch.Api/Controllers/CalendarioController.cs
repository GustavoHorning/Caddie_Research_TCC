using CaddieResearch.Api.Data;
using CaddieResearch.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CaddieResearch.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class CalendarioController : ControllerBase
{
    private readonly AppDbContext _context;

    public CalendarioController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetEventos()
    {
        var eventos = await _context.Eventos
            .OrderBy(e => e.DataHora)
            .Select(e => new 
            {
                e.Id,
                DataStr = e.DataHora.ToString("yyyy-MM-dd"),
                Hora = e.DataHora.ToString("HH:mm"),
                e.Titulo,
                e.Tipo,
                e.Impacto,
                e.Projecao,
                e.Atual,
                Ticker = e.TickerRelacionado,
                e.Pais,
                e.Descricao,
                Link = e.LinkExterno
            })
            .ToListAsync();

        return Ok(eventos);
    }

    [HttpGet("dashboard")]
    [AllowAnonymous]
    public async Task<IActionResult> GetEventosDashboard()
    {
        var hoje = DateTime.UtcNow.Date;

        var eventos = await _context.Eventos
            .Where(e => e.DataHora >= hoje)
            .OrderByDescending(e => e.Impacto)
            .ThenBy(e => e.DataHora)
            .Take(3)
            .Select(e => new 
            {
                e.Id,
                DataStr = e.DataHora.ToString("yyyy-MM-dd"),
                Hora = e.DataHora.ToString("HH:mm"),
                e.Titulo,
                e.Tipo,
                e.Impacto,
                e.Projecao,
                e.Atual,
                Ticker = e.TickerRelacionado,
                e.Pais,
                e.Descricao,
                Link = e.LinkExterno
            })
            .ToListAsync();

        return Ok(eventos);
    }
    
    [HttpPost("seed")]
    [AllowAnonymous] 
    public async Task<IActionResult> InserirMockNoBanco()
    {
        if (_context.Eventos.Any())
            return Ok("O banco já possui eventos cadastrados!");

        var hoje = DateTime.UtcNow.Date;
        var amanha = hoje.AddDays(1);

        var mocks = new List<Evento>
        {
            new Evento { 
                Titulo = "Relatório de Emprego (Payroll)", 
                DataHora = hoje.AddHours(9).AddMinutes(30), 
                Tipo = "Macro", Impacto = 3, Projecao = "180k", Atual = "---", 
                Pais = "US", Descricao = "O Nonfarm Payroll mede a variação do número de pessoas empregadas nos EUA durante o mês anterior, excluindo a indústria agrícola. É o principal termômetro de juros do Fed." 
            },
            new Evento { 
                Titulo = "IPCA-15 (Prévia da Inflação)", 
                DataHora = hoje.AddHours(10),
                Tipo = "Macro", Impacto = 3, Projecao = "0.35%", Atual = "0.40%", 
                Pais = "BR", Descricao = "O Índice Nacional de Preços ao Consumidor Amplo 15 (IPCA-15) é uma prévia da inflação oficial do país." 
            },
            new Evento { 
                Titulo = "Balanço: WEGE3", 
                DataHora = hoje.AddHours(18), 
                Tipo = "Balanço", Impacto = 2, TickerRelacionado = "WEGE3", 
                Pais = "BR", Descricao = "Divulgação dos resultados do trimestre da WEG. O mercado aguarda as margens de lucro no exterior.", LinkExterno = "https://ri.weg.net/" 
            },
            new Evento { 
                Titulo = "Live Premium: Rebalanceamento", 
                DataHora = amanha.AddHours(19), 
                Tipo = "Caddie", Impacto = 1, 
                Pais = "CA", Descricao = "Reunião exclusiva com os gestores da Caddie Research para explicar as trocas nas carteiras recomendadas deste mês.", LinkExterno = "https://youtube.com/caddieresearch" 
            }
        };

        _context.Eventos.AddRange(mocks);
        await _context.SaveChangesAsync();

        return Ok("4 Eventos de teste criados com sucesso no banco de dados!");
    }
}