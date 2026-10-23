using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using CaddieResearch.Api.Services; 
using CaddieResearch.Api.Interfaces; 
using System.Security.Claims;

namespace CaddieResearch.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AssinaturaController : ControllerBase
    {
        private readonly IAssinaturaService _assinaturaService;

        public AssinaturaController(IAssinaturaService assinaturaService)
        {
            _assinaturaService = assinaturaService;
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

            // Chamando o Serviço!
            var assinatura = await _assinaturaService.ObterAssinaturaAtivaAsync(usuarioId);

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

            var usuarioAtualizado = await _assinaturaService.CancelarAssinaturaAsync(usuarioId);

            if (usuarioAtualizado == null)
                return NotFound(new { mensagem = "Usuário não encontrado." });

            var novoToken = _tokenService.GenerateToken(usuarioAtualizado);

            return Ok(new { mensagem = "Plano cancelado.", token = novoToken });
        }
    }
}