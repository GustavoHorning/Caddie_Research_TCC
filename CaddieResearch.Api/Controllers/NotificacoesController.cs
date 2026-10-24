using CaddieResearch.Api.Interfaces;
using CaddieResearch.Api.DTOs.Notificacoes;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CaddieResearch.Api.Controllers
{
    /// <summary>
    /// Gerencia a central de notificações (Push via SignalR e persistência no banco).
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] 
    public class NotificacoesController : ControllerBase
    {
        private readonly INotificacaoService _notificacaoService;

        public NotificacoesController(INotificacaoService notificacaoService)
        {
            _notificacaoService = notificacaoService;
        }

        private int ObterUsuarioLogadoId()
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("id")?.Value;
            return int.TryParse(userIdStr, out int id) ? id : 0;
        }

        /// <summary>
        /// Retorna as últimas 20 notificações do usuário logado.
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(IEnumerable<NotificacaoResultDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetMinhasNotificacoes()
        {
            int usuarioId = ObterUsuarioLogadoId();
            if (usuarioId == 0) return Unauthorized();

            var notifs = await _notificacaoService.ObterNotificacoesAsync(usuarioId);
            return Ok(notifs);
        }

        /// <summary>
        /// Dispara uma notificação manual em tempo real para todos os usuários.
        /// </summary>
        /// <remarks>Acesso restrito para Gestores ou Administradores da plataforma.</remarks>
        [HttpPost("disparar")]
        [Authorize(Roles = "Gestor,Admin")] 
        [ProducesResponseType(typeof(NotificacaoResponseDto), StatusCodes.Status200OK)]
        public async Task<IActionResult> DispararNotificacaoTeste([FromBody] DispararNotificacaoDto dto)
        {
            await _notificacaoService.DispararNotificacaoTesteAsync(dto);
            return Ok(new NotificacaoResponseDto { Mensagem = "Notificação disparada com sucesso e salva no banco!" });
        }

        /// <summary>
        /// Marca uma notificação específica como lida.
        /// </summary>
        [HttpPut("{id}/marcar-lida")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> MarcarComoLida(int id)
        {
            int usuarioId = ObterUsuarioLogadoId();
            if (usuarioId == 0) return Unauthorized();

            await _notificacaoService.MarcarComoLidaAsync(id, usuarioId);
            return Ok();
        }

        /// <summary>
        /// Marca todas as notificações pendentes do usuário como lidas.
        /// </summary>
        [HttpPut("marcar-todas-lidas")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> MarcarTodasComoLidas()
        {
            int usuarioId = ObterUsuarioLogadoId();
            if (usuarioId == 0) return Unauthorized();

            await _notificacaoService.MarcarTodasComoLidasAsync(usuarioId);
            return Ok();
        }
    }
}