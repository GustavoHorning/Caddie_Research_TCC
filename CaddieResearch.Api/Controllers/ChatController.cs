using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CaddieResearch.Api.Data;
using CaddieResearch.Api.Models;
using System.Security.Claims;

namespace CaddieResearch.Api.Controllers;

[ApiController]
[Route("api/chat")]
public class ChatController : ControllerBase
{
    private readonly AppDbContext _context;

    public ChatController(AppDbContext context)
    {
        _context = context;
    }

    // Retorna o ID do usuário logado pelo token JWT
    private int GetUsuarioId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(claim, out var id) ? id : 0;
    }

    // ── CLIENTE: Abre uma nova conversa ──────────────────────────────
    [HttpPost("abrir")]
    public async Task<IActionResult> AbrirConversa([FromBody] AbrirConversaDto dto)
    {
        var usuarioId = GetUsuarioId();
        if (usuarioId == 0) return Unauthorized();

        // Verifica se já existe uma conversa aberta com o mesmo assunto
        var existente = await _context.Conversas
            .FirstOrDefaultAsync(c => c.UsuarioId == usuarioId
                                   && c.Assunto == dto.Assunto
                                   && c.Status == "Aberta");

        if (existente != null)
            return Ok(new { conversaId = existente.Id });

        var conversa = new Conversa
        {
            UsuarioId = usuarioId,
            Assunto = dto.Assunto,
            Status = "Aberta",
            DataAbertura = DateTime.UtcNow
        };

        _context.Conversas.Add(conversa);
        await _context.SaveChangesAsync();

        return Ok(new { conversaId = conversa.Id });
    }

    // ── CLIENTE: Envia mensagem ───────────────────────────────────────
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

        return Ok(new
        {
            mensagem.Id,
            mensagem.Conteudo,
            mensagem.EhGestor,
            mensagem.DataEnvio
        });
    }

    // ── CLIENTE: Busca mensagens de uma conversa ──────────────────────
    [HttpGet("{conversaId}/mensagens")]
    public async Task<IActionResult> BuscarMensagens(int conversaId)
    {
        var usuarioId = GetUsuarioId();
        if (usuarioId == 0) return Unauthorized();

        var mensagens = await _context.Mensagens
            .Where(m => m.ConversaId == conversaId)
            .OrderBy(m => m.DataEnvio)
            .Select(m => new
            {
                m.Id,
                m.Conteudo,
                m.EhGestor,
                m.Lida,
                m.DataEnvio
            })
            .ToListAsync();

        return Ok(mensagens);
    }

    // ── CLIENTE: Lista suas conversas ────────────────────────────────
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

    // ── GESTOR: Lista todas as conversas abertas ─────────────────────
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
}

// ── DTOs ─────────────────────────────────────────────────────────────
public class AbrirConversaDto
{
    public string Assunto { get; set; } = string.Empty;
}

public class EnviarMensagemDto
{
    public string Conteudo { get; set; } = string.Empty;
}
