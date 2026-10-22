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

    /// <summary>
    /// Retorna a agenda completa de eventos futuros e do dia de hoje.
    /// </summary>
    /// <remarks>
    /// Fornece uma lista consolidada de eventos macroeconômicos, datas de divulgação de balanços corporativos e eventos exclusivos organizados pela Caddie Research. Endpoint público (acessível sem login).
    /// </remarks>
    /// <response code="200">Lista de eventos retornada com sucesso.</response>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(200)]
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

    /// <summary>
    /// Retorna os 3 principais eventos de alto impacto para o painel inicial (Dashboard).
    /// </summary>
    /// <remarks>
    /// Filtra a agenda futura ordenando pelos eventos mais críticos (Impacto 3) que ocorrerão em breve, ideal para widgets compactos e resumos de tela. Endpoint público.
    /// </remarks>
    /// <response code="200">Top 3 eventos retornados com sucesso.</response>
    [HttpGet("dashboard")]
    [AllowAnonymous]
    [ProducesResponseType(200)]
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
    
    /// <summary>
    /// Atualiza os dados de um evento personalizado da Caddie Research.
    /// </summary>
    /// <remarks>
    /// Por regra de negócio, eventos injetados automaticamente por robôs (Macro e Balanços) não podem ser alterados manualmente. Edições válidas disparam uma notificação push para os clientes cadastrados via SignalR.
    /// </remarks>
    /// <param name="id">ID numérico do evento a ser editado.</param>
    /// <response code="200">Evento atualizado com sucesso e notificação disparada.</response>
    /// <response code="400">Tentativa de edição de evento protegido pelo sistema (Macro/Balanço).</response>
    /// <response code="404">Evento não encontrado no banco de dados.</response>
    [HttpPut("{id}")]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
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

    /// <summary>
    /// Agenda um novo evento exclusivo (Live, Fechamento de Mercado, Reunião) pela equipe Caddie.
    /// </summary>
    /// <remarks>
    /// Cria o evento, o classifica na categoria "Caddie" e dispara um alerta de "Novo Evento Agendado" em tempo real para os assinantes conectados.
    /// </remarks>
    /// <response code="200">Evento agendado com sucesso e clientes notificados.</response>
    [HttpPost("caddie")]
    [ProducesResponseType(200)]
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

    /// <summary>
    /// Remove permanentemente um evento do calendário.
    /// </summary>
    /// <remarks>
    /// Se o evento removido pertencer à Caddie Research (Ex: Cancelamento de Live), uma notificação automática de cancelamento será disparada para os clientes da base.
    /// </remarks>
    /// <param name="id">ID numérico do evento a ser excluído.</param>
    /// <response code="200">Evento removido com sucesso.</response>
    /// <response code="404">Evento não encontrado no banco de dados.</response>
    [HttpDelete("{id}")]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]
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

    public class CriarEventoCaddieDto
    {
        /// <summary>
        /// Nome/título do evento.
        /// </summary>
        /// <example>Live Fechamento de Mercado</example>
        public string Titulo { get; set; }

        /// <summary>
        /// Data e horário programado para o evento (UTC).
        /// </summary>
        /// <example>2026-10-30T18:00:00Z</example>
        public DateTime DataHora { get; set; }

        /// <summary>
        /// Breve descrição ou pauta do que será abordado no evento.
        /// </summary>
        /// <example>Vamos discutir a taxa Selic e o impacto nos FIIs de papel.</example>
        public string Descricao { get; set; }

        /// <summary>
        /// URL externa de transmissão (Ex: Link do Zoom, YouTube ou Teams).
        /// </summary>
        /// <example>https://youtube.com/live/exemplo</example>
        public string LinkExterno { get; set; }

        /// <summary>
        /// Nível de impacto de 1 a 3 (3 é o maior, marcado com estrela).
        /// </summary>
        /// <example>3</example>
        public int Impacto { get; set; }
    }
}