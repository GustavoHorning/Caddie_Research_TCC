using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using CaddieResearch.Api.Data;
using CaddieResearch.Api.DTOs.Notificacoes;
using CaddieResearch.Api.Models;
using CaddieResearch.Api.Hubs;
using CaddieResearch.Api.Interfaces;

namespace CaddieResearch.Api.Services;

public class NotificacaoService : INotificacaoService
{
    private readonly AppDbContext _context;
    private readonly IHubContext<NotificationHub> _hubContext;

    public NotificacaoService(AppDbContext context, IHubContext<NotificationHub> hubContext)
    {
        _context = context;
        _hubContext = hubContext;
    }

    public async Task DispararNotificacaoCarteiraAsync(int carteiraId, string titulo, string mensagem)
    {
        try
        {
            var carteira = await _context.Carteiras.FindAsync(carteiraId);
            if (carteira == null) return;

            TimeZoneInfo fusoBrasilia;
            try 
            {
                fusoBrasilia = TimeZoneInfo.FindSystemTimeZoneById("E. South America Standard Time");
            } 
            catch 
            {
                fusoBrasilia = TimeZoneInfo.FindSystemTimeZoneById("America/Sao_Paulo");
            }
            DateTime horaBrasilia = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, fusoBrasilia);

            var planosPermitidos = new List<string>();

            if (carteira.NivelAcesso <= 1) planosPermitidos.AddRange(new[] { "Basic", "Premium", "Black" });
            else if (carteira.NivelAcesso <= 2) planosPermitidos.AddRange(new[] { "Premium", "Black" });
            else planosPermitidos.Add("Black");

            var usuariosAlvoIds = await _context.Usuarios
                .Where(u => u.TipoPerfil == "Gestor" || 
                            _context.Assinaturas.Any(a => a.UsuarioId == u.Id 
                                                       && a.Status == "Ativo" 
                                                       && planosPermitidos.Contains(a.PlanoNome)))
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
                    Tipo = "Trade",
                    LinkDestino = $"/carteiras/{carteira.Id}", 
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
            Console.WriteLine($"Erro ao disparar notificação centralizada: {ex.Message}");
        }
    }
    
    public async Task DispararNotificacaoEventoCaddieAsync(string titulo, string mensagem)
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
    
    public async Task DispararNotificacaoMorningCallAsync(string titulo)
    {
        var notificacao = new Notificacao
        {
            UsuarioId = null, 
            Titulo = "Novo Morning Call disponível",
            Mensagem = titulo,
            Tipo = "Info",
            LinkDestino = "/morning-call",
            DataCriacao = DateTime.UtcNow
        };
        
        _context.Notificacoes.Add(notificacao);
        await _context.SaveChangesAsync();
        
        await _hubContext.Clients.All.SendAsync("ReceberNotificacao", notificacao);
    }
    
    public async Task<IEnumerable<NotificacaoResultDto>> ObterNotificacoesAsync(int usuarioId)
    {
        return await _context.Notificacoes
            .Where(n => n.UsuarioId == usuarioId || n.UsuarioId == null)
            .OrderByDescending(n => n.DataCriacao)
            .Take(20)
            .Select(n => new NotificacaoResultDto
            {
                Id = n.Id,
                Titulo = n.Titulo,
                Mensagem = n.Mensagem,
                Tipo = n.Tipo,
                LinkDestino = n.LinkDestino,
                Lida = n.Lida,
                DataCriacao = n.DataCriacao
            })
            .ToListAsync();
    }

    public async Task DispararNotificacaoTesteAsync(DispararNotificacaoDto dto)
    {
        var novaNotificacao = new Notificacao
        {
            Titulo = dto.Titulo,
            Mensagem = dto.Mensagem,
            Tipo = dto.Tipo,
            LinkDestino = dto.LinkDestino,
            DataCriacao = DateTime.UtcNow,
            Lida = false
        };
        
        _context.Notificacoes.Add(novaNotificacao);
        await _context.SaveChangesAsync();
        await _hubContext.Clients.All.SendAsync("ReceberNotificacao", novaNotificacao);
    }

    public async Task MarcarComoLidaAsync(int notificacaoId, int usuarioId)
    {
        var notificacao = await _context.Notificacoes.FindAsync(notificacaoId);
        
        if (notificacao != null && (notificacao.UsuarioId == usuarioId || notificacao.UsuarioId == null))
        {
            if (!notificacao.Lida)
            {
                notificacao.Lida = true;
                await _context.SaveChangesAsync();
            }
        }
    }

    public async Task MarcarTodasComoLidasAsync(int usuarioId)
    {
        var notificacoesNaoLidas = await _context.Notificacoes
            .Where(n => !n.Lida && (n.UsuarioId == usuarioId || n.UsuarioId == null))
            .ToListAsync();
            
        if (notificacoesNaoLidas.Any())
        {
            foreach (var notif in notificacoesNaoLidas)
            {
                notif.Lida = true;
            }
            await _context.SaveChangesAsync();
        }
    }
    
    public async Task DispararNotificacaoRelatorioAsync(int carteiraId, string titulo, string mensagem)
    {
        try
        {
            var carteira = await _context.Carteiras.FindAsync(carteiraId);
            if (carteira == null) return;

            TimeZoneInfo fusoBrasilia;
            try { fusoBrasilia = TimeZoneInfo.FindSystemTimeZoneById("E. South America Standard Time"); }
            catch { fusoBrasilia = TimeZoneInfo.FindSystemTimeZoneById("America/Sao_Paulo"); }
            DateTime horaBrasilia = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, fusoBrasilia);

            var planosPermitidos = new List<string>();

            if (carteira.NivelAcesso <= 1) planosPermitidos.AddRange(new[] { "Basic", "Premium", "Black" });
            else if (carteira.NivelAcesso <= 2) planosPermitidos.AddRange(new[] { "Premium", "Black" });
            else planosPermitidos.Add("Black");

            var usuariosAlvoIds = await _context.Usuarios
                .Where(u => u.TipoPerfil == "Gestor" || 
                            _context.Assinaturas.Any(a => a.UsuarioId == u.Id 
                                                       && a.Status == "Ativo" 
                                                       && planosPermitidos.Contains(a.PlanoNome)))
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
                    Tipo = "Conteudo", // Tipo atualizado!
                    LinkDestino = $"/relatorios", 
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
            Console.WriteLine($"Erro ao disparar notificação de relatório: {ex.Message}");
        }
    }
}