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
    [ApiController]
    [Route("api/[controller]")]
    public class PagamentoController : ControllerBase
    {
        private readonly IAssinaturaService _assinaturaService; 
        private readonly AbacatePayService _abacatePayService;
        private readonly TokenService _tokenService;

        private static readonly ConcurrentDictionary<string, bool> _processedWebhooks = new();
        private static readonly SemaphoreSlim _semaphore = new(1, 1);

        public PagamentoController(
            IAssinaturaService assinaturaService, 
            AbacatePayService abacatePayService, 
            TokenService tokenService)
        {
            _assinaturaService = assinaturaService;
            _abacatePayService = abacatePayService;
            _tokenService = tokenService;
        }

        [HttpPost("checkout")]
        public async Task<IActionResult> CriarCheckout([FromBody] CheckoutDto request)
        {
            try
            {
                var url = await _abacatePayService.GerarCheckoutAsync(request.Plano, request.Metodo, request.UsuarioId);
                return Ok(new { url });
            }
            catch (Exception ex)
            {
                return BadRequest(new { erro = "Falha no gateway", detalhe = ex.Message });
            }
        }

        [HttpPost("webhook")]
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
                    return BadRequest(new { erro = "Usuário inválido no metadata." });
                }

                await _semaphore.WaitAsync();

                try
                {
                    await _assinaturaService.ProcessarPagamentoAprovadoAsync(usuarioId, planoEscolhido, metodoPagamento, valorPago, checkoutId);
                }
                catch (Exception ex)
                {
                    _processedWebhooks.TryRemove(checkoutId, out _);
                    return NotFound(new { erro = ex.Message });
                }
                finally
                {
                    _semaphore.Release();
                }
            }
            catch (Exception ex)
            {
                _processedWebhooks.TryRemove(checkoutId, out _);
                return StatusCode(500, new 
                { 
                    erro = "Erro interno ao processar o webhook.", 
                    excecaoPrincipal = ex.Message
                });
            }

            return Ok();
        }

        [HttpGet("verificar-status")]
        [Authorize]
        public async Task<IActionResult> VerificarStatus([FromQuery] string planoDesejado)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out int usuarioId)) return Unauthorized();

            var usuarioPago = await _assinaturaService.VerificarStatusPagamentoAsync(usuarioId, planoDesejado);

            if (usuarioPago != null)
            {
                var novoToken = _tokenService.GenerateToken(usuarioPago);
                return Ok(new { status = "pago", token = novoToken });
            }

            return Ok(new { status = "pendente" });
        }
    }
}