using CaddieResearch.Api.Data;
using CaddieResearch.Api.Models;
using CaddieResearch.Api.DTOs.Chat;
using CaddieResearch.Api.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace CaddieResearch.Api.Services;

public class ChatService : IChatService
{
    private readonly AppDbContext _context;
    private readonly EmailService _emailService;

    public ChatService(AppDbContext context, EmailService emailService)
    {
        _context = context;
        _emailService = emailService;
    }

    private static string PrimeiroNome(string? nomeCompleto)
    {
        if (string.IsNullOrWhiteSpace(nomeCompleto)) return "Caddie";
        return nomeCompleto.Trim().Split(' ')[0];
    }

    public async Task<(bool Sucesso, string Mensagem, int ConversaId)> AbrirConversaAsync(int usuarioId, string assunto)
    {
        var conversa = new Conversa
        {
            UsuarioId = usuarioId,
            Assunto = assunto,
            Status = "Aberta",
            DataAbertura = DateTime.UtcNow
        };

        _context.Conversas.Add(conversa);
        await _context.SaveChangesAsync();

        return (true, "Conversa aberta com sucesso.", conversa.Id);
    }

    public async Task<(bool Sucesso, string Mensagem, MensagemResultDto? NovaMensagem)> EnviarMensagemAsync(int conversaId, int usuarioId, string conteudo)
    {
        var conversa = await _context.Conversas.FindAsync(conversaId);
        if (conversa == null) return (false, "Conversa não encontrada.", null);

        var usuario = await _context.Usuarios.FindAsync(usuarioId);
        var ehGestor = usuario?.TipoPerfil == "Gestor";

        var mensagem = new Mensagem
        {
            ConversaId = conversaId,
            RemetenteId = usuarioId,
            Conteudo = conteudo,
            EhGestor = ehGestor,
            Lida = false,
            DataEnvio = DateTime.UtcNow
        };

        _context.Mensagens.Add(mensagem);
        await _context.SaveChangesAsync();

        var dto = new MensagemResultDto 
        {
            Id = mensagem.Id,
            Conteudo = mensagem.Conteudo,
            EhGestor = mensagem.EhGestor,
            DataEnvio = mensagem.DataEnvio,
            NomeRemetente = usuario?.Nome ?? "Usuário"
        };

        return (true, string.Empty, dto);
    }

    public async Task<(bool Sucesso, string Mensagem, List<MensagemResultDto>? Mensagens)> BuscarMensagensAsync(int conversaId, int usuarioId)
    {
        var existe = await _context.Conversas.AnyAsync(c => c.Id == conversaId);
        if (!existe) return (false, "Conversa não encontrada.", null);

        var mensagens = await _context.Mensagens
            .Where(m => m.ConversaId == conversaId)
            .OrderBy(m => m.DataEnvio)
            .Select(m => new MensagemResultDto 
            {
                Id = m.Id,
                Conteudo = m.Conteudo,
                EhGestor = m.EhGestor,
                Lida = m.Lida,
                DataEnvio = m.DataEnvio,
                NomeRemetente = m.Remetente!.Nome
            })
            .ToListAsync();

        return (true, string.Empty, mensagens);
    }

    public async Task<List<ConversaResultDto>> MinhasConversasAsync(int usuarioId)
    {
        return await _context.Conversas
            .Where(c => c.UsuarioId == usuarioId)
            .OrderByDescending(c => c.DataAbertura)
            .Select(c => new ConversaResultDto
            {
                Id = c.Id,
                Assunto = c.Assunto,
                Status = c.Status,
                DataAbertura = c.DataAbertura,
                TotalMensagens = c.Mensagens.Count
            })
            .ToListAsync();
    }

    public async Task<(bool Sucesso, string Mensagem, List<ConversaGestorResultDto>? Conversas)> TodasConversasGestorAsync(int gestorId)
    {
        var usuario = await _context.Usuarios.FindAsync(gestorId);
        if (usuario?.TipoPerfil != "Gestor") return (false, "Acesso negado.", null);

        var conversas = await _context.Conversas
            .Include(c => c.Usuario)
            .Include(c => c.Mensagens)
            .Where(c => c.Usuario!.TipoPerfil != "Gestor") 
            .OrderByDescending(c => c.DataAbertura)
            .Select(c => new ConversaGestorResultDto
            {
                Id = c.Id,
                Assunto = c.Assunto,
                Status = c.Status,
                DataAbertura = c.DataAbertura,
                NomeCliente = c.Usuario!.Nome,
                EmailCliente = c.Usuario.Email,
                TotalMensagens = c.Mensagens.Count,
                NaoLidas = c.Mensagens.Count(m => !m.Lida && !m.EhGestor)
            })
            .ToListAsync();

        return (true, string.Empty, conversas);
    }

    public async Task<(bool Sucesso, string Mensagem)> EncerrarConversaAsync(int conversaId, int gestorId)
    {
        var usuario = await _context.Usuarios.FindAsync(gestorId);
        if (usuario?.TipoPerfil != "Gestor") return (false, "Acesso negado.");

        var conversa = await _context.Conversas
            .Include(c => c.Usuario)
            .Include(c => c.Mensagens)
                .ThenInclude(m => m.Remetente)
            .FirstOrDefaultAsync(c => c.Id == conversaId);

        if (conversa == null) return (false, "Conversa não encontrada.");

        conversa.Status = "Fechada";
        await _context.SaveChangesAsync();

        try
        {
            var historico = conversa.Mensagens
                .OrderBy(m => m.DataEnvio)
                .Select(m => (
                    Remetente: m.EhGestor ? $"Analista {PrimeiroNome(m.Remetente!.Nome)}" : conversa.Usuario!.Nome,
                    EhGestor: m.EhGestor,
                    Conteudo: m.Conteudo,
                    DataEnvio: m.DataEnvio
                )).ToList();

            await _emailService.EnviarHistoricoChatAsync(
                emailDestino: conversa.Usuario!.Email,
                nomeDestino:  conversa.Usuario.Nome,
                assunto:      conversa.Assunto,
                mensagens:    historico
            );
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Chat] Erro ao enviar e-mail de histórico: {ex.Message}");
        }

        return (true, "Conversa encerrada com sucesso.");
    }

    public async Task<(bool Sucesso, string Mensagem)> DeletarConversaAsync(int conversaId, int gestorId)
    {
        var usuario = await _context.Usuarios.FindAsync(gestorId);
        if (usuario?.TipoPerfil != "Gestor") return (false, "Acesso negado.");

        var conversa = await _context.Conversas
            .Include(c => c.Mensagens)
            .FirstOrDefaultAsync(c => c.Id == conversaId);

        if (conversa == null) return (false, "Conversa não encontrada.");
        if (conversa.Status != "Fechada") return (false, "Só é possível deletar conversas encerradas.");

        _context.Mensagens.RemoveRange(conversa.Mensagens);
        _context.Conversas.Remove(conversa);
        await _context.SaveChangesAsync();

        return (true, "Conversa removida com sucesso.");
    }

    public async Task<(bool Sucesso, string Mensagem, string Status)> VerificarStatusAsync(int conversaId)
    {
        var conversa = await _context.Conversas.FindAsync(conversaId);
        if (conversa == null) return (false, "Conversa não encontrada.", string.Empty);
        
        return (true, string.Empty, conversa.Status);
    }
}