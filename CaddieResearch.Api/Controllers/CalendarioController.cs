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
        var hoje = DateTime.UtcNow.Date;

        var eventos = await _context.Eventos
            .Where(e => e.DataHora >= hoje) 
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
    
    public class CriarEventoCaddieDto
    {
        public string Titulo { get; set; }
        public DateTime DataHora { get; set; }
        public string Descricao { get; set; }
        public string LinkExterno { get; set; }
        public int Impacto { get; set; }
    }

    [HttpPost("caddie")]
    public async Task<IActionResult> CriarEventoCaddie([FromBody] CriarEventoCaddieDto dto)
    {
        var novoEvento = new Evento
        {
            Titulo = dto.Titulo,
            DataHora = dto.DataHora,
            Tipo = "Caddie", 
            Impacto = dto.Impacto,
            Pais = "CA", 
            Descricao = dto.Descricao,
            LinkExterno = dto.LinkExterno
        };

        _context.Eventos.Add(novoEvento);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Evento da Caddie criado com sucesso!", eventoId = novoEvento.Id });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeletarEvento(int id)
    {
        var evento = await _context.Eventos.FindAsync(id);
        if (evento == null) return NotFound("Evento não encontrado.");

        _context.Eventos.Remove(evento);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Evento removido com sucesso!" });
    }
    
    
}