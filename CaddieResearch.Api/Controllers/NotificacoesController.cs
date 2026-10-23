using CaddieResearch.Api.Interfaces;
using CaddieResearch.Api.DTOs.Notificacoes;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CaddieResearch.Api.Controllers
{
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

        [HttpGet]
        public async Task<IActionResult> GetMinhasNotificacoes()
        {
            int usuarioId = ObterUsuarioLogadoId();
            if (usuarioId == 0) return Unauthorized();

            var notifs = await _notificacaoService.ObterNotificacoesAsync(usuarioId);
            return Ok(notifs);
        }

        [HttpPost("disparar")]
        [Authorize(Roles = "Gestor,Admin")] 
        public async Task<IActionResult> DispararNotificacaoTeste([FromBody] DispararNotificacaoDto dto)
        {
            await _notificacaoService.DispararNotificacaoTesteAsync(dto);
            return Ok(new { mensagem = "Notificação disparada com sucesso e salva no banco!" });
        }

        [HttpPut("{id}/marcar-lida")]
        public async Task<IActionResult> MarcarComoLida(int id)
        {
            int usuarioId = ObterUsuarioLogadoId();
            if (usuarioId == 0) return Unauthorized();

            await _notificacaoService.MarcarComoLidaAsync(id, usuarioId);
            return Ok();
        }

        [HttpPut("marcar-todas-lidas")]
        public async Task<IActionResult> MarcarTodasComoLidas()
        {
            int usuarioId = ObterUsuarioLogadoId();
            if (usuarioId == 0) return Unauthorized();

            await _notificacaoService.MarcarTodasComoLidasAsync(usuarioId);
            return Ok();
        }
    }
}