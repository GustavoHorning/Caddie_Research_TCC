using CaddieResearch.Api.Data;
using CaddieResearch.Api.Models;
using CaddieResearch.Api.DTOs.Calendario; 
using CaddieResearch.Api.Interfaces;    
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
    private readonly INotificacaoService _notificacaoService; 

    public CalendarioController(AppDbContext context, INotificacaoService notificacaoService)
    {
        _context = context;
        _notificacaoService = notificacaoService;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetEventos()
    {
        var hoje = DateTime.UtcNow.Date;

        var eventos = await _context.Eventos
            .Where(e => e.DataHora >= hoje) 
            .OrderBy(e => e.DataHora)
            .Select(e => new EventoResultDto 
            {
                Id = e.Id,
                DataStr = e.DataHora.ToString("yyyy-MM-dd"),
                Hora = e.DataHora.ToString("HH:mm"),
                Titulo = e.Titulo,
                Tipo = e.Tipo,
                Impacto = e.Impacto,
                Projecao = e.Projecao,
                Atual = e.Atual,
                Ticker = e.TickerRelacionado,
                Pais = e.Pais,
                Descricao = e.Descricao,
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
            .Select(e => new EventoResultDto 
            {
                Id = e.Id,
                DataStr = e.DataHora.ToString("yyyy-MM-dd"),
                Hora = e.DataHora.ToString("HH:mm"),
                Titulo = e.Titulo,
                Tipo = e.Tipo,
                Impacto = e.Impacto,
                Projecao = e.Projecao,
                Atual = e.Atual,
                Ticker = e.TickerRelacionado,
                Pais = e.Pais,
                Descricao = e.Descricao,
                Link = e.LinkExterno
            })
            .ToListAsync();

        return Ok(eventos);
    }
    
    [HttpPut("{id}")]
    public async Task<IActionResult> AtualizarEventoPeloGestor(int id, [FromBody] AtualizarEventoDto dto) // <-- Usando DTO de Entrada
    {
        var eventoExistente = await _context.Eventos.FindAsync(id);
        if (eventoExistente == null) 
            return NotFound(new { mensagem = "Evento não encontrado." });

        if (eventoExistente.Tipo == "Balanço" || eventoExistente.Tipo == "Macro") 
        {
            return BadRequest(new { mensagem = "Operação negada: Apenas eventos da própria Caddie podem ser editados manualmente." });
        }

        eventoExistente.Titulo = dto.Titulo;
        eventoExistente.Descricao = dto.Descricao;
        eventoExistente.DataHora = dto.DataHora; 
        eventoExistente.LinkExterno = dto.LinkExterno;
    
        await _context.SaveChangesAsync();

        await _notificacaoService.DispararNotificacaoEventoCaddieAsync(
            "🔄 Evento Atualizado",
            $"O Gestor atualizou as informações do evento '{dto.Titulo}'. Confira os detalhes na agenda."
        );

        return Ok(eventoExistente);
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

        await _notificacaoService.DispararNotificacaoEventoCaddieAsync(
            "📅 Novo Evento Agendado",
            $"A Caddie Research agendou '{dto.Titulo}'. Acesse o calendário e não fique de fora!"
        );

        return Ok(new { message = "Evento da Caddie criado com sucesso!", eventoId = novoEvento.Id });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeletarEvento(int id)
    {
        var evento = await _context.Eventos.FindAsync(id);
        if (evento == null) return NotFound("Evento não encontrado.");

        string titulo = evento.Titulo;
        string tipo = evento.Tipo;

        _context.Eventos.Remove(evento);
        await _context.SaveChangesAsync();

        if (tipo == "Caddie")
        {
            await _notificacaoService.DispararNotificacaoEventoCaddieAsync(
                "🗑️ Evento Cancelado",
                $"O evento '{titulo}' foi cancelado e retirado da agenda."
            );
        }

        return Ok(new { message = "Evento removido com sucesso!" });
    }
}