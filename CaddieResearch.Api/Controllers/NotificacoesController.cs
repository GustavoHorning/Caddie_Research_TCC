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

        [HttpGet]
        [Authorize] 
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

        [HttpPost("disparar")]
        [AllowAnonymous] 
        public async Task<IActionResult> DispararNotificacaoTeste([FromBody] Notificacao novaNotificacao)
        {
            novaNotificacao.DataCriacao = DateTime.UtcNow;
            
            _context.Notificacoes.Add(novaNotificacao);
            await _context.SaveChangesAsync();

            await _hubContext.Clients.All.SendAsync("ReceberNotificacao", novaNotificacao);

            return Ok(new { mensagem = "Notificação disparada com sucesso e salva no banco!" });
        }

        [HttpPut("{id}/marcar-lida")]
        [AllowAnonymous] 
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

        [HttpPut("marcar-todas-lidas")]
        [AllowAnonymous] 
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