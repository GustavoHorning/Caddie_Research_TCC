using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CaddieResearch.Api.Data;
using CaddieResearch.Api.Models;
using CaddieResearch.Api.Services;
using CaddieResearch.Api.Interfaces; 
using CaddieResearch.Api.DTOs.Chat; 
using System.Security.Claims;

namespace CaddieResearch.Api.Controllers;

[ApiController]
[Route("api/chat")]
[Microsoft.AspNetCore.Authorization.Authorize]
public class ChatController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly EmailService _emailService;
    private readonly IChatService _chatService; 

    public ChatController(AppDbContext context, EmailService emailService, IChatService chatService)
    {
        _context = context;
        _emailService = emailService;
        _chatService = chatService;
    }

    private int GetUsuarioId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(claim, out var id) ? id : 0;
    }

    private static string PrimeiroNome(string? nomeCompleto)
    {
        if (string.IsNullOrWhiteSpace(nomeCompleto)) return "Caddie";
        return nomeCompleto.Trim().Split(' ')[0];
    }

    [HttpPost("abrir")]
    public async Task<IActionResult> AbrirConversa([FromBody] AbrirConversaDto dto) 
    {
        var usuarioId = GetUsuarioId();
        if (usuarioId == 0) return Unauthorized();

        var conversa = await _chatService.AbrirConversaAsync(usuarioId, dto.Assunto);

        return Ok(new { conversaId = conversa.Id });
    }

    [HttpPost("{conversaId}/mensagem")]
    public async Task<IActionResult> EnviarMensagem(int conversaId, [FromBody] EnviarMensagemDto dto) 
    {
        var usuarioId = GetUsuarioId();
        if (usuarioId == 0) return Unauthorized();

        var conversa = await _context.Conversas.FindAsync(conversaId);
        if (conversa == null) return NotFound("Conversa não encontrada.");

        var usuario = await _context.Usuarios.FindAsync(usuarioId);
        var ehGestor = usuario?.TipoPerfil == "Gestor";

        var mensagem = new Mensagem
        {
            ConversaId = conversaId,
            RemetenteId = usuarioId,
            Conteudo = dto.Conteudo,
            EhGestor = ehGestor,
            Lida = false,
            DataEnvio = DateTime.UtcNow
        };

        _context.Mensagens.Add(mensagem);
        await _context.SaveChangesAsync();

        return Ok(new MensagemResultDto 
        {
            Id = mensagem.Id,
            Conteudo = mensagem.Conteudo,
            EhGestor = mensagem.EhGestor,
            DataEnvio = mensagem.DataEnvio,
            NomeRemetente = usuario?.Nome ?? "Usuário"
        });
    }

    [HttpGet("{conversaId}/mensagens")]
    public async Task<IActionResult> BuscarMensagens(int conversaId)
    {
        var usuarioId = GetUsuarioId();
        if (usuarioId == 0) return Unauthorized();

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

        return Ok(mensagens);
    }

    [HttpGet("minhas-conversas")]
    public async Task<IActionResult> MinhasConversas()
    {
        var usuarioId = GetUsuarioId();
        if (usuarioId == 0) return Unauthorized();

        var conversas = await _context.Conversas
            .Where(c => c.UsuarioId == usuarioId)
            .OrderByDescending(c => c.DataAbertura)
            .Select(c => new
            {
                c.Id,
                c.Assunto,
                c.Status,
                c.DataAbertura,
                TotalMensagens = c.Mensagens.Count
            })
            .ToListAsync();

        return Ok(conversas);
    }

    [HttpGet("gestor/todas")]
    public async Task<IActionResult> TodasConversas()
    {
        var usuarioId = GetUsuarioId();
        if (usuarioId == 0) return Unauthorized();

        var usuario = await _context.Usuarios.FindAsync(usuarioId);
        if (usuario?.TipoPerfil != "Gestor") return Forbid();

        var conversas = await _context.Conversas
            .Include(c => c.Usuario)
            .Include(c => c.Mensagens)
            .Where(c => c.Usuario!.TipoPerfil != "Gestor") 
            .OrderByDescending(c => c.DataAbertura)
            .Select(c => new
            {
                c.Id,
                c.Assunto,
                c.Status,
                c.DataAbertura,
                NomeCliente = c.Usuario!.Nome,
                EmailCliente = c.Usuario.Email,
                TotalMensagens = c.Mensagens.Count,
                NaoLidas = c.Mensagens.Count(m => !m.Lida && !m.EhGestor)
            })
            .ToListAsync();

        return Ok(conversas);
    }

    [HttpPut("{conversaId}/encerrar")]
    public async Task<IActionResult> EncerrarConversa(int conversaId)
    {
        var usuarioId = GetUsuarioId();
        if (usuarioId == 0) return Unauthorized();

        var usuario = await _context.Usuarios.FindAsync(usuarioId);
        if (usuario?.TipoPerfil != "Gestor") return Forbid();

        var conversa = await _context.Conversas
            .Include(c => c.Usuario)
            .Include(c => c.Mensagens)
                .ThenInclude(m => m.Remetente)
            .FirstOrDefaultAsync(c => c.Id == conversaId);

        if (conversa == null) return NotFound("Conversa não encontrada.");

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

        return Ok(new { mensagem = "Conversa encerrada com sucesso." });
    }

    [HttpDelete("{conversaId}")]
    public async Task<IActionResult> DeletarConversa(int conversaId)
    {
        var usuarioId = GetUsuarioId();
        if (usuarioId == 0) return Unauthorized();

        var usuario = await _context.Usuarios.FindAsync(usuarioId);
        if (usuario?.TipoPerfil != "Gestor") return Forbid();

        var conversa = await _context.Conversas
            .Include(c => c.Mensagens)
            .FirstOrDefaultAsync(c => c.Id == conversaId);

        if (conversa == null) return NotFound();
        if (conversa.Status != "Fechada") return BadRequest("Só é possível deletar conversas encerradas.");

        _context.Mensagens.RemoveRange(conversa.Mensagens);
        _context.Conversas.Remove(conversa);
        await _context.SaveChangesAsync();

        return Ok(new { mensagem = "Conversa removida com sucesso." });
    }

    [HttpGet("{conversaId}/status")]
    public async Task<IActionResult> VerificarStatus(int conversaId)
    {
        var conversa = await _context.Conversas.FindAsync(conversaId);
        if (conversa == null) return NotFound();
        return Ok(new { status = conversa.Status });
    }
}