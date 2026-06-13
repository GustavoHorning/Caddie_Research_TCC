using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CaddieResearch.Api.Data;
using CaddieResearch.Api.Models;
using CaddieResearch.Api.Services;
using System.Security.Claims;

namespace CaddieResearch.Api.Controllers;

[ApiController]
[Route("api/chat")]
[Microsoft.AspNetCore.Authorization.Authorize]
public class ChatController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly EmailService _emailService;

    public ChatController(AppDbContext context, EmailService emailService)
    {
        _context = context;
        _emailService = emailService;
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

        // Mantém apenas as 6 conversas mais recentes por usuário
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
            .Where(c => c.Usuario!.TipoPerfil != "Gestor") // Ignora conversas abertas pelo próprio gestor
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

    // ── GESTOR: Encerra uma conversa ─────────────────────────────────
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
            .FirstOrDefaultAsync(c => c.Id == conversaId);

        if (conversa == null) return NotFound("Conversa não encontrada.");

        conversa.Status = "Fechada";
        await _context.SaveChangesAsync();

        // Envia histórico por e-mail ao cliente (silencioso se não configurado)
        try
        {
            var historico = conversa.Mensagens
                .OrderBy(m => m.DataEnvio)
                .Select(m => (
                    Remetente: m.EhGestor ? "Analista Caddie" : conversa.Usuario!.Nome,
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

    // ── GESTOR: Deleta conversa encerrada ────────────────────────────
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

    // ── CLIENTE: Verifica status da conversa ─────────────────────────
    [HttpGet("{conversaId}/status")]
    public async Task<IActionResult> VerificarStatus(int conversaId)
    {
        var conversa = await _context.Conversas.FindAsync(conversaId);
        if (conversa == null) return NotFound();
        return Ok(new { status = conversa.Status });
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
