using System;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CaddieResearch.Api.Data;
using CaddieResearch.Models;
using System.Linq;
using System.Threading.Tasks;

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
            int nivelPermitido = 0;

            if (isGestor)
            {
                nivelPermitido = 99;
            }
            else
            {
                // Verifica no banco de dados se a assinatura ainda está dentro da validade
                var assinaturaValida = await _context.Assinaturas
                    .Where(a => a.UsuarioId == usuario.Id && a.Status == "Ativo" && a.DataVencimento > DateTime.UtcNow)
                    .OrderByDescending(a => a.DataVencimento)
                    .FirstOrDefaultAsync();

                string planoReal = assinaturaValida?.PlanoNome;

                nivelPermitido = planoReal switch
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
        [Authorize] // <-- ADICIONADO: Exige estar logado
        public async Task<ActionResult<Carteira>> GetCarteira(int id)
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdString))
                return Unauthorized(new { mensagem = "Usuário não autenticado." });

            var usuario = await _context.Usuarios.FindAsync(int.Parse(userIdString));
            if (usuario == null)
                return NotFound(new { mensagem = "Usuário não encontrado." });

            // CALCULA O NÍVEL PERMITIDO IGUAL AO MÉTODO DE LISTAGEM
            bool isGestor = usuario.TipoPerfil == "Gestor" || usuario.TipoPerfil == "Admin";
            int nivelPermitido = 0;

            if (isGestor)
            {
                nivelPermitido = 99;
            }
            else
            {
                var assinaturaValida = await _context.Assinaturas
                    .Where(a => a.UsuarioId == usuario.Id && a.Status == "Ativo" && a.DataVencimento > DateTime.UtcNow)
                    .OrderByDescending(a => a.DataVencimento)
                    .FirstOrDefaultAsync();

                string planoReal = assinaturaValida?.PlanoNome;

                nivelPermitido = planoReal switch
                {
                    "Basic" => 1,
                    "Premium" => 2,
                    "Black" => 3,
                    _ => 0
                };
            }

            var carteira = await _context.Carteiras
                .Include(c => c.Ativos)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (carteira == null)
            {
                return NotFound();
            }

            // <-- A MÁGICA AQUI: Bloqueia se a carteira exigir um nível maior que o do usuário
            if (carteira.NivelAcesso > nivelPermitido)
            {
                return StatusCode(403, new { mensagem = "Seu plano não permite acessar esta carteira." });
            }

            return carteira;
        }
    }
}