using CaddieResearch.Api.Data;
using CaddieResearch.Api.Models;
using CaddieResearch.Api.DTOs.Calendario;
using CaddieResearch.Api.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace CaddieResearch.Api.Services;

public class CalendarioService : ICalendarioService
{
    private readonly AppDbContext _context;
    private readonly INotificacaoService _notificacaoService;

    public CalendarioService(AppDbContext context, INotificacaoService notificacaoService)
    {
        _context = context;
        _notificacaoService = notificacaoService;
    }

    public async Task<List<EventoResultDto>> ObterEventosAsync()
    {
        var hoje = DateTime.UtcNow.Date;

        return await _context.Eventos
            .Where(e => e.DataHora >= hoje) 
            .OrderBy(e => e.DataHora)
            .Select(e => MapearParaDto(e))
            .ToListAsync();
    }

    public async Task<List<EventoResultDto>> ObterEventosDashboardAsync()
    {
        var hoje = DateTime.UtcNow.Date;

        return await _context.Eventos
            .Where(e => e.DataHora >= hoje)
            .OrderByDescending(e => e.Impacto)
            .ThenBy(e => e.DataHora)
            .Take(3)
            .Select(e => MapearParaDto(e))
            .ToListAsync();
    }

    public async Task<(bool Sucesso, string Mensagem, EventoResultDto? Evento)> AtualizarEventoPeloGestorAsync(int id, AtualizarEventoDto dto)
    {
        var eventoExistente = await _context.Eventos.FindAsync(id);
        if (eventoExistente == null) 
            return (false, "Evento não encontrado.", null);

        if (eventoExistente.Tipo == "Balanço" || eventoExistente.Tipo == "Macro") 
            return (false, "Operação negada: Apenas eventos da própria Caddie podem ser editados manualmente.", null);

        eventoExistente.Titulo = dto.Titulo;
        eventoExistente.Descricao = dto.Descricao;
        eventoExistente.DataHora = dto.DataHora; 
        eventoExistente.LinkExterno = dto.LinkExterno;
    
        await _context.SaveChangesAsync();

        await _notificacaoService.DispararNotificacaoEventoCaddieAsync(
            "🔄 Evento Atualizado",
            $"O Gestor atualizou as informações do evento '{dto.Titulo}'. Confira os detalhes na agenda."
        );

        return (true, string.Empty, MapearParaDto(eventoExistente));
    }

    public async Task<(bool Sucesso, string Mensagem, int EventoId)> CriarEventoCaddieAsync(CriarEventoCaddieDto dto)
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

        return (true, "Evento da Caddie criado com sucesso!", novoEvento.Id);
    }

    public async Task<(bool Sucesso, string Mensagem)> DeletarEventoAsync(int id)
    {
        var evento = await _context.Eventos.FindAsync(id);
        if (evento == null) return (false, "Evento não encontrado.");

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

        return (true, "Evento removido com sucesso!");
    }

    private static EventoResultDto MapearParaDto(Evento e)
    {
        return new EventoResultDto
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
        };
    }
}