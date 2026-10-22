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

        /// <summary>
        /// Retorna as carteiras recomendadas disponíveis para o usuário.
        /// </summary>
        /// <remarks>
        /// Consulta o plano ativo do usuário (Basic, Premium ou Black) e retorna apenas as carteiras cuja propriedade NivelAcesso seja igual ou inferior ao permitido pelo plano contratado.
        /// </remarks>
        /// <response code="200">Lista filtrada de carteiras retornada com sucesso.</response>
        /// <response code="401">Usuário não possui credenciais válidas.</response>
        /// <response code="404">Registro do usuário não encontrado na base de dados.</response>
        [HttpGet]
        [Authorize]
        [ProducesResponseType(200)]
        [ProducesResponseType(401)]
        [ProducesResponseType(404)]
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

        /// <summary>
        /// Retorna a composição detalhada de uma carteira específica.
        /// </summary>
        /// <remarks>
        /// Valida se o cliente possui acesso premium suficiente e, caso afirmativo, carrega os metadados da carteira juntamente com todos os ativos (ações/FIIs) que a compõem.
        /// </remarks>
        /// <param name="id">O ID exclusivo da carteira. Ex: 1 para "Ações B3" ou 2 para "Renda Fixa".</param>
        /// <response code="200">Composição da carteira retornada com sucesso.</response>
        /// <response code="401">Usuário não possui credenciais válidas.</response>
        /// <response code="403">O usuário logado possui um plano inferior ao necessário para acessar esta carteira (Paywall ativo).</response>
        /// <response code="404">Carteira ou usuário não encontrados.</response>
        [HttpGet("{id}")]
        [Authorize]
        [ProducesResponseType(200)]
        [ProducesResponseType(401)]
        [ProducesResponseType(403)]
        [ProducesResponseType(404)]
        public async Task<ActionResult<Carteira>> GetCarteira(int id)
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

            if (carteira.NivelAcesso > nivelPermitido)
            {
                return StatusCode(403, new { mensagem = "Seu plano não permite acessar esta carteira." });
            }

            return carteira;
        }
    }
}