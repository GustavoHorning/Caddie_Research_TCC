using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using CaddieResearch.Api.Services; 
using CaddieResearch.Api.Interfaces; 
using System.Security.Claims;
using CaddieResearch.Api.DTOs.Assinatura;

namespace CaddieResearch.Api.Controllers
{
    /// <summary>
    /// Gerencia o status, planos e cancelamentos de assinatura dos clientes.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AssinaturaController : ControllerBase
    {
        private readonly IAssinaturaService _assinaturaService;
        private readonly TokenService _tokenService;

        public AssinaturaController(IAssinaturaService assinaturaService, TokenService tokenService)
        {
            _assinaturaService = assinaturaService;
            _tokenService = tokenService;
        }

        private int ObterUsuarioLogadoId()
        {
            var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(idClaim, out int id) ? id : 0;
        }

        /// <summary>
        /// Retorna os detalhes do plano ativo do usuário.
        /// </summary>
        /// <remarks>
        /// Busca o registro de assinatura vigente do cliente na plataforma, exibindo nome do plano e data de vencimento.
        /// </remarks>
        /// <response code="200">Plano encontrado e retornado com sucesso.</response>
        /// <response code="401">Usuário não autenticado.</response>
        /// <response code="404">Nenhuma assinatura ativa encontrada para este usuário.</response>
        [HttpGet("atual")]
        [ProducesResponseType(typeof(PlanoAtualResultDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> ObterPlanoAtual()
        {
            int usuarioId = ObterUsuarioLogadoId();
            if (usuarioId == 0) return Unauthorized();

            var assinatura = await _assinaturaService.ObterAssinaturaAtivaAsync(usuarioId);

            if (assinatura == null)
            {
                return NotFound(new { erro = "Nenhum plano ativo encontrado." });
            }

            return Ok(new PlanoAtualResultDto
            { 
                Plano = assinatura.PlanoNome,
                Vencimento = assinatura.DataVencimento.ToString("dd/MM/yyyy")
            });
        }

        /// <summary>
        /// Cancela a assinatura atual do cliente.
        /// </summary>
        /// <remarks>
        /// Atualiza o status da assinatura vigente para 'Cancelado', revoga as permissões premium atreladas ao usuário e gera um novo Token JWT de sessão restrito.
        /// </remarks>
        /// <response code="200">Assinatura cancelada com sucesso. Retorna o novo token de segurança.</response>
        /// <response code="401">Usuário não autenticado.</response>
        /// <response code="404">Usuário não encontrado na base de dados.</response>
        [HttpPost("cancelar")]
        [ProducesResponseType(typeof(CancelamentoResultDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> CancelarPlano()
        {
            int usuarioId = ObterUsuarioLogadoId();
            if (usuarioId == 0) return Unauthorized();

            var usuarioAtualizado = await _assinaturaService.CancelarAssinaturaAsync(usuarioId);

            if (usuarioAtualizado == null)
                return NotFound(new { erro = "Usuário não encontrado." });

            var novoToken = _tokenService.GenerateToken(usuarioAtualizado);

            return Ok(new CancelamentoResultDto 
            { 
                Mensagem = "Plano cancelado com sucesso.", 
                Token = novoToken 
            });
        }
    }
}