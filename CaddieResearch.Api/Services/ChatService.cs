using Microsoft.EntityFrameworkCore;
using CaddieResearch.Api.Data;
using CaddieResearch.Api.Models;
using CaddieResearch.Api.Interfaces;

namespace CaddieResearch.Api.Services;

public class ChatService : IChatService
{
    private readonly AppDbContext _context;

    public ChatService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Conversa> AbrirConversaAsync(int usuarioId, string assunto)
    {
        var existente = await _context.Conversas
            .FirstOrDefaultAsync(c => c.UsuarioId == usuarioId
                                      && c.Assunto == assunto
                                      && c.Status == "Aberta");

        if (existente != null)
            return existente;

        var novaConversa = new Conversa
        {
            UsuarioId = usuarioId,
            Assunto = assunto,
            Status = "Aberta",
            DataAbertura = DateTime.UtcNow
        };

        _context.Conversas.Add(novaConversa);
        await _context.SaveChangesAsync();

        var todasConversas = await _context.Conversas
            .Where(c => c.UsuarioId == usuarioId)
            .OrderByDescending(c => c.DataAbertura)
            .ToListAsync();

        if (todasConversas.Count > 6)
        {
            var parasRemover = todasConversas.Skip(6).ToList();
            foreach (var antiga in parasRemover)
            {
                var mensagens = _context.Mensagens.Where(m => m.ConversaId == antiga.Id);
                _context.Mensagens.RemoveRange(mensagens);
                _context.Conversas.Remove(antiga);
            }
            await _context.SaveChangesAsync();
        }

        return novaConversa;
    }
}