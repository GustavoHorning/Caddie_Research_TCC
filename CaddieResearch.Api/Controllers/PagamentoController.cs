using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Concurrent;
using System.Text.Json;
using System.Security.Claims;
using CaddieResearch.Api.DTOs.Pagamento;
using CaddieResearch.Api.Interfaces; 
using CaddieResearch.Api.Services; 

namespace CaddieResearch.Api.Controllers
{
    /// <summary>
    /// Gerencia o fluxo de assinaturas, checkouts e webhooks integrados com a AbacatePay.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class PagamentoController : ControllerBase
    {
        private readonly IAssinaturaService _assinaturaService; 
        private readonly IAbacatePayService _abacatePayService;
        private readonly TokenService _tokenService;

        private static readonly ConcurrentDictionary<string, bool> _processedWebhooks = new();
        private static readonly SemaphoreSlim _semaphore = new(1, 1);

        public PagamentoController(
            IAssinaturaService assinaturaService, 
            IAbacatePayService abacatePayService, 
            TokenService tokenService)
        {
            _assinaturaService = assinaturaService;
            _abacatePayService = abacatePayService;
            _tokenService = tokenService;
        }

        /// <summary>
        /// Gera uma URL de checkout para o plano e método escolhidos.
        /// </summary>
        [HttpPost("checkout")]
        [ProducesResponseType(typeof(CheckoutResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(PagamentoErrorDto), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> CriarCheckout([FromBody] PagamentoDtos request)
        {
            try
            {
                var url = await _abacatePayService.GerarCheckoutAsync(request.Plano, request.Metodo, request.UsuarioId);
                return Ok(new CheckoutResponseDto { Url = url });
            }
            catch (Exception ex)
            {
                return BadRequest(new PagamentoErrorDto { Erro = "Falha no gateway", Detalhe = ex.Message });
            }
        }

        /// <summary>
        /// Recebe e processa eventos (Webhooks) enviados pelo gateway de pagamento.
        /// </summary>
        /// <remarks>
        /// Contém controle de concorrência nativo (Semaphore/Dictionary) para evitar a aprovação duplicada do mesmo checkout.
        /// </remarks>
        [HttpPost("webhook")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> Webhook()
        {
            using var reader = new StreamReader(Request.Body);
            var payload = await reader.ReadToEndAsync();

            using var jsonDoc = JsonDocument.Parse(payload);
            var root = jsonDoc.RootElement;

            if (root.GetProperty("event").GetString() != "checkout.completed")
            {
                return Ok(); 
            }

            var checkoutNode = root.GetProperty("data").GetProperty("checkout");
            var checkoutId = checkoutNode.GetProperty("id").GetString() ?? string.Empty;

            if (string.IsNullOrEmpty(checkoutId) || !_processedWebhooks.TryAdd(checkoutId, true))
            {
                return Ok(new { message = "Webhook já processado ou em processamento." });
            }

            try
            {
                var metadata = checkoutNode.GetProperty("metadata");
                var usuarioIdStr = metadata.GetProperty("idUsuario").GetString();
                var planoEscolhido = metadata.GetProperty("planoEscolhido").GetString() ?? string.Empty;
                var metodoPagamento = metadata.GetProperty("metodoPagamento").GetString() ?? string.Empty;

                var amountEmCentavos = checkoutNode.GetProperty("paidAmount").GetInt32();
                var valorPago = amountEmCentavos / 100m;

                if (!int.TryParse(usuarioIdStr, out var usuarioId))
                {
                    _processedWebhooks.TryRemove(checkoutId, out _);
                    return BadRequest(new PagamentoErrorDto { Erro = "Usuário inválido no metadata." });
                }

                await _semaphore.WaitAsync();

                try
                {
                    await _assinaturaService.ProcessarPagamentoAprovadoAsync(usuarioId, planoEscolhido, metodoPagamento, valorPago, checkoutId);
                }
                catch (Exception ex)
                {
                    _processedWebhooks.TryRemove(checkoutId, out _);
                    return NotFound(new PagamentoErrorDto { Erro = ex.Message });
                }
                finally
                {
                    _semaphore.Release();
                }
            }
            catch (Exception ex)
            {
                _processedWebhooks.TryRemove(checkoutId, out _);
                return StatusCode(500, new PagamentoErrorDto 
                { 
                    Erro = "Erro interno ao processar o webhook.", 
                    Detalhe = ex.Message
                });
            }

            return Ok();
        }

        /// <summary>
        /// Verifica periodicamente se um pagamento via PIX foi aprovado e renova o Token JWT.
        /// </summary>
        [HttpGet("verificar-status")]
        [Authorize]
        [ProducesResponseType(typeof(VerificarStatusResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> VerificarStatus([FromQuery] string planoDesejado)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out int usuarioId)) return Unauthorized();

            var usuarioPago = await _assinaturaService.VerificarStatusPagamentoAsync(usuarioId, planoDesejado);

            if (usuarioPago != null)
            {
                var novoToken = _tokenService.GenerateToken(usuarioPago);
                return Ok(new VerificarStatusResponseDto { Status = "pago", Token = novoToken });
            }

            return Ok(new VerificarStatusResponseDto { Status = "pendente", Token = null });
        }
    }
}