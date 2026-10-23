using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CaddieResearch.Api.Data;
using CaddieResearch.Models;
using CaddieResearch.Api.Interfaces; 

namespace CaddieResearch.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CarteirasController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IAssinaturaService _assinaturaService; 

        public CarteirasController(AppDbContext context, IAssinaturaService assinaturaService)
        {
            _context = context;
            _assinaturaService = assinaturaService;
        }

        private int ObterUsuarioLogadoId()
        {
            var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(idClaim, out int id) ? id : 0;
        }

        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetCarteiras()
        {
            int usuarioId = ObterUsuarioLogadoId();
            if (usuarioId == 0) return Unauthorized(new { mensagem = "Usuário não autenticado." });

            int nivelPermitido = await _assinaturaService.ObterNivelAcessoAsync(usuarioId);

            var carteiras = await _context.Carteiras
                .Include(c => c.Ativos)
                .Where(c => c.NivelAcesso <= nivelPermitido)
                .ToListAsync();

            return Ok(carteiras);
        }

        [HttpGet("{id}")]
        [Authorize] 
        public async Task<ActionResult<Carteira>> GetCarteira(int id)
        {
            int usuarioId = ObterUsuarioLogadoId();
            if (usuarioId == 0) return Unauthorized(new { mensagem = "Usuário não autenticado." });

            int nivelPermitido = await _assinaturaService.ObterNivelAcessoAsync(usuarioId);

            var carteira = await _context.Carteiras
                .Include(c => c.Ativos)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (carteira == null)
            {
                return NotFound();
            }

            if (carteira.NivelAcesso > nivelPermitido)
            {
                return StatusCode(403, new { mensagem = "Seu plano não permite acessar esta carteira." });
            }

            return Ok(carteira);
        }
    }
}