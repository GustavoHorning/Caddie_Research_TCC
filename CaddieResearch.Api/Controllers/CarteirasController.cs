using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CaddieResearch.Api.Data;
using CaddieResearch.Models;

namespace CaddieResearch.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CarteirasController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CarteirasController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [Authorize] 
        public async Task<IActionResult> GetCarteiras()
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    
            if (string.IsNullOrEmpty(userIdString)) 
                return Unauthorized(new { mensagem = "Usuário não autenticado." });

            var usuario = await _context.Usuarios.FindAsync(int.Parse(userIdString));

            if (usuario == null) 
                return NotFound(new { mensagem = "Usuário não encontrado." });

            bool isGestor = usuario.TipoPerfil == "Gestor" || usuario.TipoPerfil == "Admin";

            int nivelPermitido;

            if (isGestor)
            {
                nivelPermitido = 99; 
            }
            else
            {
                nivelPermitido = usuario.Plano switch
                {
                    "Basic" => 1,
                    "Premium" => 2,
                    "Black" => 3,
                    _ => 0 
                };
            }

            var carteiras = await _context.Carteiras
                .Include(c => c.Ativos)
                .Where(c => c.NivelAcesso <= nivelPermitido)
                .ToListAsync();

            return Ok(carteiras);
        }
        
        [HttpGet("{id}")]
        public async Task<ActionResult<Carteira>> GetCarteira(int id)
        {
            var carteira = await _context.Carteiras
                .Include(c => c.Ativos)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (carteira == null)
            {
                return NotFound();
            }

            return carteira;
        }
    }
}