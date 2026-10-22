using CaddieResearch.Api.Data;
using CaddieResearch.Api.Hubs;
using CaddieResearch.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using System.Linq;
using System.Threading.Tasks;
using System;

namespace CaddieResearch.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class NotificacoesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<NotificationHub> _hubContext; 

        public NotificacoesController(AppDbContext context, IHubContext<NotificationHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        /// <summary>
        /// Lista o histórico recente de notificações do usuário.
        /// </summary>
        /// <remarks>
        /// Busca as últimas 20 notificações (pessoais ou globais) enviadas para o cliente logado, ordenando da mais recente para a mais antiga.
        /// </remarks>
        /// <response code="200">Lista de notificações carregada.</response>
        /// <response code="401">Usuário não autenticado.</response>
        [HttpGet]
        [Authorize] 
        [ProducesResponseType(200)]
        [ProducesResponseType(401)]
        public IActionResult GetMinhasNotificacoes()
        {
            var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value 
                            ?? User.FindFirst("id")?.Value;
            
            if (string.IsNullOrEmpty(userIdStr)) return Unauthorized();
            
            int usuarioId = int.Parse(userIdStr);

            var notifs = _context.Notificacoes
                .Where(n => n.UsuarioId == usuarioId || n.UsuarioId == null)
                .OrderByDescending(n => n.DataCriacao)
                .Take(20)
                .ToList();

            return Ok(notifs);
        }

        /// <summary>
        /// Dispara uma notificação Push avulsa para toda a base (Acesso Administrativo).
        /// </summary>
        /// <remarks>
        /// Grava a notificação global no banco de dados e utiliza o SignalR para emitir o evento em tempo real para os dispositivos conectados (WebSockets).
        /// </remarks>
        [HttpPost("disparar")]
        [AllowAnonymous] 
        [ProducesResponseType(200)]
        public async Task<IActionResult> DispararNotificacaoTeste([FromBody] Notificacao novaNotificacao)
        {
            novaNotificacao.DataCriacao = DateTime.UtcNow;
            
            _context.Notificacoes.Add(novaNotificacao);
            await _context.SaveChangesAsync();

            await _hubContext.Clients.All.SendAsync("ReceberNotificacao", novaNotificacao);

            return Ok(new { mensagem = "Notificação disparada com sucesso e salva no banco!" });
        }

        /// <summary>
        /// Marca uma notificação específica como "Lida".
        /// </summary>
        /// <remarks>
        /// Atualiza o status de leitura no banco de dados para remover a indicação visual de alerta não lido no front-end.
        /// </remarks>
        /// <param name="id">ID numérico da notificação.</param>
        [HttpPut("{id}/marcar-lida")]
        [AllowAnonymous] 
        [ProducesResponseType(200)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> MarcarComoLida(int id)
        {
            var notificacao = await _context.Notificacoes.FindAsync(id);
            if (notificacao == null) return NotFound();

            if (!notificacao.Lida)
            {
                notificacao.Lida = true;
                await _context.SaveChangesAsync();
            }

            return Ok();
        }

        /// <summary>
        /// Marca todas as notificações pendentes do usuário como "Lidas".
        /// </summary>
        /// <remarks>
        /// Varre o banco de dados buscando notificações não lidas e atualiza seus status em lote.
        /// </remarks>
        [HttpPut("marcar-todas-lidas")]
        [AllowAnonymous]
        [ProducesResponseType(200)]
        public async Task<IActionResult> MarcarTodasComoLidas()
        {
            var notificacoesNaoLidas = _context.Notificacoes.Where(n => !n.Lida).ToList();
            
            if (notificacoesNaoLidas.Any())
            {
                foreach (var notif in notificacoesNaoLidas)
                {
                    notif.Lida = true;
                }
                await _context.SaveChangesAsync();
            }

            return Ok();
        }
    }
}