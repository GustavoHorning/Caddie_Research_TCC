using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using CaddieResearch.Api.Data;
using CaddieResearch.Api.Models;
using CaddieResearch.Api.Services; 
using System.Security.Claims;
using System.Linq;
using System.Threading.Tasks;
using System;

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

        [HttpGet("atual")]
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

        [HttpPost("cancelar")]
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