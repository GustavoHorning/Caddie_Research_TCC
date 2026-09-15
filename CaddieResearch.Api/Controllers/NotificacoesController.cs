using CaddieResearch.Api.Data;
using CaddieResearch.Api.Hubs;
using CaddieResearch.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;

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
        [AllowAnonymous]
        public IActionResult GetMinhasNotificacoes()
        {
            var notifs = _context.Notificacoes
                .OrderByDescending(n => n.DataCriacao)
                .Take(20)
                .ToList();

            return Ok(notifs);
        }

        [HttpPost("disparar")]
        [AllowAnonymous] // TODO: Proteger com [Authorize] depois
        public async Task<IActionResult> DispararNotificacaoTeste([FromBody] Notificacao novaNotificacao)
        {
            novaNotificacao.DataCriacao = DateTime.UtcNow;
            
            _context.Notificacoes.Add(novaNotificacao);
            await _context.SaveChangesAsync();

            await _hubContext.Clients.All.SendAsync("ReceberNotificacao", novaNotificacao);

            return Ok(new { mensagem = "Notificação disparada com sucesso e salva no banco!" });
        }
    }
}