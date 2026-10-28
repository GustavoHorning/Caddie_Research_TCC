using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using CaddieResearch.Api.Interfaces; 
using CaddieResearch.Api.DTOs.Chat; 
using System.Security.Claims;

namespace CaddieResearch.Api.Controllers;

/// <summary>
/// Gerencia os chats e o suporte direto entre clientes e analistas/gestores.
/// </summary>
[ApiController]
[Route("api/chat")]
[Authorize]
public class ChatController : ControllerBase
{
    private readonly IChatService _chatService; 

    public ChatController(IChatService chatService)
    {
        _chatService = chatService;
    }

    private int GetUsuarioId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(claim, out var id) ? id : 0;
    }

    /// <summary>
    /// Inicia uma nova conversa de suporte.
    /// </summary>
    /// <response code="200">Conversa criada. Retorna o ID para envio de mensagens.</response>
    [HttpPost("abrir")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> AbrirConversa([FromBody] AbrirConversaDto dto) 
    {
        var usuarioId = GetUsuarioId();
        var (sucesso, mensagem, conversaId) = await _chatService.AbrirConversaAsync(usuarioId, dto.Assunto);
        return Ok(new { conversaId });
    }

    /// <summary>
    /// Envia uma mensagem em um chat existente.
    /// </summary>
    /// <response code="200">Mensagem salva e retornada formatada.</response>
    /// <response code="404">A conversa informada não existe.</response>
    [HttpPost("{conversaId}/mensagem")]
    [ProducesResponseType(typeof(MensagemResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> EnviarMensagem(int conversaId, [FromBody] EnviarMensagemDto dto) 
    {
        var usuarioId = GetUsuarioId();
        var (sucesso, mensagem, novaMensagem) = await _chatService.EnviarMensagemAsync(conversaId, usuarioId, dto.Conteudo);

        if (!sucesso) return NotFound(new { erro = mensagem });
        return Ok(novaMensagem);
    }

    /// <summary>
    /// Lista o histórico de mensagens de uma conversa.
    /// </summary>
    [HttpGet("{conversaId}/mensagens")]
    [ProducesResponseType(typeof(List<MensagemResultDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> BuscarMensagens(int conversaId)
    {
        var usuarioId = GetUsuarioId();
        var (sucesso, mensagem, mensagens) = await _chatService.BuscarMensagensAsync(conversaId, usuarioId);

        if (!sucesso) return NotFound(new { erro = mensagem });
        return Ok(mensagens);
    }

    /// <summary>
    /// Lista os chats iniciados pelo usuário logado.
    /// </summary>
    [HttpGet("minhas-conversas")]
    [ProducesResponseType(typeof(List<ConversaResultDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> MinhasConversas()
    {
        var usuarioId = GetUsuarioId();
        var conversas = await _chatService.MinhasConversasAsync(usuarioId);
        return Ok(conversas);
    }

    /// <summary>
    /// Lista todos os chats abertos pelos clientes (Acesso restrito: Gestor).
    /// </summary>
    [HttpGet("gestor/todas")]
    [ProducesResponseType(typeof(List<ConversaGestorResultDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> TodasConversas()
    {
        var usuarioId = GetUsuarioId();
        var (sucesso, mensagem, conversas) = await _chatService.TodasConversasGestorAsync(usuarioId);

        if (!sucesso) return Forbid();
        return Ok(conversas);
    }

    /// <summary>
    /// Encerra um chat e envia o histórico por e-mail (Acesso restrito: Gestor).
    /// </summary>
    [HttpPut("{conversaId}/encerrar")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> EncerrarConversa(int conversaId)
    {
        var usuarioId = GetUsuarioId();
        var (sucesso, mensagem) = await _chatService.EncerrarConversaAsync(conversaId, usuarioId);

        if (!sucesso)
        {
            if (mensagem.Contains("Acesso negado")) return Forbid();
            return NotFound(new { erro = mensagem });
        }

        return Ok(new { mensagem });
    }

    /// <summary>
    /// Deleta um chat permanentemente. O chat precisa estar fechado (Acesso restrito: Gestor).
    /// </summary>
    [HttpDelete("{conversaId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeletarConversa(int conversaId)
    {
        var usuarioId = GetUsuarioId();
        var (sucesso, mensagem) = await _chatService.DeletarConversaAsync(conversaId, usuarioId);

        if (!sucesso)
        {
            if (mensagem.Contains("Acesso negado")) return Forbid();
            if (mensagem.Contains("não encontrada")) return NotFound(new { erro = mensagem });
            return BadRequest(new { erro = mensagem });
        }

        return Ok(new { mensagem });
    }

    /// <summary>
    /// Consulta se um chat está 'Aberto' ou 'Fechado'.
    /// </summary>
    [HttpGet("{conversaId}/status")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> VerificarStatus(int conversaId)
    {
        var (sucesso, mensagem, status) = await _chatService.VerificarStatusAsync(conversaId);
        
        if (!sucesso) return NotFound(new { erro = mensagem });
        return Ok(new { status });
    }
}