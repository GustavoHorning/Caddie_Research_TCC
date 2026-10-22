using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using CaddieResearch.Api.Data;
using CaddieResearch.Api.Models;
using CaddieResearch.Api.Services; 
using System.Security.Claims;

namespace CaddieResearch.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AssinaturaController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AssinaturaController(AppDbContext context)
        {
            _context = context;
        }

        private int ObterUsuarioLogadoId()
        {
            var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(idClaim, out int id) ? id : 0;
        }

        /// <summary>
        /// Retorna os detalhes do plano ativo do usuário autenticado.
        /// </summary>
        /// <remarks>
        /// Busca o registro de assinatura vigente do cliente na plataforma, exibindo nome do plano e data de vencimento.
        /// </remarks>
        /// <response code="200">Plano encontrado e retornado com sucesso.</response>
        /// <response code="401">Usuário não autenticado.</response>
        /// <response code="404">Nenhuma assinatura ativa encontrada para este usuário.</response>
        [HttpGet("atual")]
        [ProducesResponseType(200)]
        [ProducesResponseType(401)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> ObterPlanoAtual()
        {
            int usuarioId = ObterUsuarioLogadoId();
            if (usuarioId == 0) return Unauthorized();

            var assinatura = await _context.Assinaturas
                .Where(a => a.UsuarioId == usuarioId && a.Status == "Ativo" && a.DataVencimento > DateTime.UtcNow)
                .OrderByDescending(a => a.DataVencimento)
                .FirstOrDefaultAsync();

            if (assinatura == null)
            {
                return NotFound(new { mensagem = "Nenhum plano ativo encontrado." });
            }

            return Ok(new 
            { 
                plano = assinatura.PlanoNome,
                vencimento = assinatura.DataVencimento.ToString("dd/MM/yyyy")
            });
        }

        /// <summary>
        /// Cancela a assinatura atual do cliente.
        /// </summary>
        /// <remarks>
        /// Atualiza o status da assinatura vigente para 'Cancelado', revoga as permissões de plano atreladas ao usuário e gera um novo Token JWT de sessão restrito.
        /// </remarks>
        /// <response code="200">Assinatura cancelada com sucesso. Retorna o novo token de segurança.</response>
        /// <response code="401">Usuário não autenticado.</response>
        [HttpPost("cancelar")]
        [ProducesResponseType(200)]
        [ProducesResponseType(401)]
        public async Task<IActionResult> CancelarPlano([FromServices] TokenService _tokenService)
        {
            int usuarioId = ObterUsuarioLogadoId();
            if (usuarioId == 0) return Unauthorized();

            var assinaturasAtivas = await _context.Assinaturas
                .Where(a => a.UsuarioId == usuarioId && a.Status == "Ativo")
                .ToListAsync();

            foreach (var assinatura in assinaturasAtivas)
            {
                assinatura.Status = "Cancelado";
            }

            var usuario = await _context.Usuarios.FindAsync(usuarioId);
            if (usuario != null)
            {
                usuario.Plano = null; 
            }

            await _context.SaveChangesAsync();

            var novoToken = _tokenService.GenerateToken(usuario);

            return Ok(new { mensagem = "Plano cancelado.", token = novoToken });
        }
    }
}