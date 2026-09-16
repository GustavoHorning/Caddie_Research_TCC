using CaddieResearch.Api.Data;
using CaddieResearch.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using CaddieResearch.Api.Hubs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CaddieResearch.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class CalendarioController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IHubContext<NotificationHub> _hubContext; 

    public CalendarioController(AppDbContext context, IHubContext<NotificationHub> hubContext)
    {
        _context = context;
        _hubContext = hubContext;
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
    
    [HttpPut("{id}")]
    public async Task<IActionResult> AtualizarEventoPeloGestor(int id, [FromBody] Evento eventoAtualizado)
    {
        var eventoExistente = await _context.Eventos.FindAsync(id);
        if (eventoExistente == null) 
            return NotFound(new { mensagem = "Evento não encontrado." });

        if (eventoExistente.Tipo == "Balanço" || eventoExistente.Tipo == "Macro") 
        {
            return BadRequest(new { mensagem = "Operação negada: Apenas eventos da própria Caddie podem ser editados manualmente." });
        }

        eventoExistente.Titulo = eventoAtualizado.Titulo;
        eventoExistente.Descricao = eventoAtualizado.Descricao;
        eventoExistente.DataHora = eventoAtualizado.DataHora; 
        eventoExistente.LinkExterno = eventoAtualizado.LinkExterno;
    
        await _context.SaveChangesAsync();

        await DispararNotificacaoEventoCaddieAsync(
            "🔄 Evento Atualizado",
            $"O Gestor atualizou as informações do evento '{eventoAtualizado.Titulo}'. Confira os detalhes na agenda."
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

        await DispararNotificacaoEventoCaddieAsync(
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
            await DispararNotificacaoEventoCaddieAsync(
                "🗑️ Evento Cancelado",
                $"O evento '{titulo}' foi cancelado e retirado da agenda."
            );
        }

        return Ok(new { message = "Evento removido com sucesso!" });
    }
    
    private async Task DispararNotificacaoEventoCaddieAsync(string titulo, string mensagem)
    {
        try
        {
            TimeZoneInfo fusoBrasilia;
            try { fusoBrasilia = TimeZoneInfo.FindSystemTimeZoneById("E. South America Standard Time"); }
            catch { fusoBrasilia = TimeZoneInfo.FindSystemTimeZoneById("America/Sao_Paulo"); }
            DateTime horaBrasilia = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, fusoBrasilia);

            var usuariosAlvoIds = await _context.Usuarios
                .Where(u => u.TipoPerfil == "Gestor" || 
                            _context.Assinaturas.Any(a => a.UsuarioId == u.Id && a.Status == "Ativo"))
                .Select(u => u.Id)
                .Distinct()
                .ToListAsync();

            var novasNotificacoes = new List<Notificacao>();

            foreach (var usuarioId in usuariosAlvoIds)
            {
                novasNotificacoes.Add(new Notificacao
                {
                    UsuarioId = usuarioId,
                    Titulo = titulo,
                    Mensagem = mensagem,
                    Tipo = "Alerta", 
                    LinkDestino = "/calendario", 
                    Lida = false,
                    DataCriacao = horaBrasilia
                });
            }

            if (novasNotificacoes.Any())
            {
                _context.Notificacoes.AddRange(novasNotificacoes);
                await _context.SaveChangesAsync();

                foreach (var notif in novasNotificacoes)
                {
                    await _hubContext.Clients.Group($"User_{notif.UsuarioId}")
                                     .SendAsync("ReceberNotificacao", notif);
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Erro ao disparar notificação de evento: {ex.Message}");
        }
    }
}