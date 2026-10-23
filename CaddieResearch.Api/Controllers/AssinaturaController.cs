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

            var usuarioAtualizado = await _assinaturaService.CancelarAssinaturaAsync(usuarioId);

            if (usuarioAtualizado == null)
                return NotFound(new { mensagem = "Usuário não encontrado." });

            var novoToken = _tokenService.GenerateToken(usuarioAtualizado);

            return Ok(new { mensagem = "Plano cancelado.", token = novoToken });
        }
    }
}