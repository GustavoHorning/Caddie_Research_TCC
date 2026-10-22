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

    /// <summary>
    /// Abre uma nova conversa com os analistas da Caddie.
    /// </summary>
    /// <remarks>
    /// Inicia um novo canal de suporte/dúvidas. Existe um limite estrutural de 6 conversas ativas por usuário para evitar sobrecarga no banco. Ao ultrapassar o limite, as conversas mais antigas são descartadas.
    /// </remarks>
    /// <response code="200">Conversa aberta (ou já existente) com sucesso. Retorna o ID da conversa.</response>
    /// <response code="401">Usuário não autenticado.</response>
    [HttpPost("abrir")]
    [ProducesResponseType(200)]
    [ProducesResponseType(401)]
    public async Task<IActionResult> AbrirConversa([FromBody] AbrirConversaDto dto)
    {
        var usuarioId = GetUsuarioId();
        if (usuarioId == 0) return Unauthorized();

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

    /// <summary>
    /// Envia uma mensagem no chat ativo.
    /// </summary>
    /// <remarks>
    /// Registra a mensagem na base. Se o remetente for um Gestor, a flag `EhGestor` é ativada para renderização no Frontend.
    /// </remarks>
    /// <param name="conversaId">O ID da conversa aberta.</param>
    /// <response code="200">Mensagem registrada com sucesso.</response>
    /// <response code="404">Conversa não encontrada.</response>
    [HttpPost("{conversaId}/mensagem")]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]
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

    /// <summary>
    /// Busca o histórico de mensagens de uma conversa.
    /// </summary>
    /// <response code="200">Retorna a lista de mensagens ordenadas cronologicamente.</response>
    [HttpGet("{conversaId}/mensagens")]
    [ProducesResponseType(200)]
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
                m.DataEnvio,
                NomeRemetente = m.Remetente!.Nome
            })
            .ToListAsync();

        return Ok(mensagens);
    }

    /// <summary>
    /// Lista os tickets/conversas do usuário logado (Acesso Cliente).
    /// </summary>
    [HttpGet("minhas-conversas")]
    [ProducesResponseType(200)]
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

    /// <summary>
    /// Lista todos os tickets/conversas abertos no sistema (Acesso Gestor).
    /// </summary>
    /// <remarks>
    /// Retorna as conversas com cálculo de métricas (mensagens não lidas) para a central de atendimento do painel do Gestor.
    /// </remarks>
    /// <response code="200">Lista de tickets.</response>
    /// <response code="403">Acesso restrito apenas para Gestores.</response>
    [HttpGet("gestor/todas")]
    [ProducesResponseType(200)]
    [ProducesResponseType(403)]
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

    /// <summary>
    /// Encerra um ticket de suporte (Acesso Gestor).
    /// </summary>
    /// <remarks>
    /// Muda o status para "Fechada" e dispara um e-mail transacional automático com o histórico completo da conversa para o cliente.
    /// </remarks>
    [HttpPut("{conversaId}/encerrar")]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]
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

    /// <summary>
    /// Exclui permanentemente um ticket do banco de dados (Acesso Gestor).
    /// </summary>
    [HttpDelete("{conversaId}")]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
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

    /// <summary>
    /// Verifica em tempo real o status de um ticket.
    /// </summary>
    [HttpGet("{conversaId}/status")]
    [ProducesResponseType(200)]
    public async Task<IActionResult> VerificarStatus(int conversaId)
    {
        var conversa = await _context.Conversas.FindAsync(conversaId);
        if (conversa == null) return NotFound();
        return Ok(new { status = conversa.Status });
    }
}

public class AbrirConversaDto
{
    /// <summary>
    /// Assunto do atendimento.
    /// </summary>
    /// <example>Dúvida sobre a tese de VALE3</example>
    public string Assunto { get; set; } = string.Empty;
}

public class EnviarMensagemDto
{
    /// <summary>
    /// Texto da mensagem.
    /// </summary>
    /// <example>Olá! Não entendi o racional do último relatório.</example>
    public string Conteudo { get; set; } = string.Empty;
}