using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Concurrent;
using System.Text.Json;
using CaddieResearch.Api.Data;
using CaddieResearch.Api.Models;
using CaddieResearch.Api.Services;

namespace CaddieResearch.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PagamentoController : ControllerBase
    {
        private readonly AppDbContext _context;
        private static readonly ConcurrentDictionary<string, bool> _processedWebhooks = new();
        private static readonly SemaphoreSlim _semaphore = new(1, 1);

        public PagamentoController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost("checkout")]
        public async Task<IActionResult> CriarCheckout(
            [FromBody] CheckoutDto request, 
            [FromServices] AbacatePayService abacatePayService)
        {
            try
            {
                var url = await abacatePayService.GerarCheckoutAsync(request.Plano, request.Metodo, request.UsuarioId);
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
                    var usuario = await _context.Usuarios.FindAsync(usuarioId);
                    if (usuario == null)
                    {
                        _processedWebhooks.TryRemove(checkoutId, out _);
                        return NotFound(new { erro = $"Usuário com ID {usuarioId} não existe no banco de dados." });
                    }

                    var assinaturasAtivas = await _context.Assinaturas
                        .Where(a => a.UsuarioId == usuarioId && a.Status == "Ativo")
                        .ToListAsync();

                    foreach (var assinatura in assinaturasAtivas)
                    {
                        assinatura.Status = "Cancelado";
                    }

                    usuario.Plano = planoEscolhido;

                    var novaAssinatura = new Assinatura
                    {
                        UsuarioId = usuarioId,
                        PlanoNome = planoEscolhido,
                        ValorPago = valorPago,
                        Status = "Ativo",
                        CheckoutId = checkoutId,
                        TipoPagamento = metodoPagamento,
                        DataInicio = DateTime.UtcNow,
                        DataVencimento = DateTime.UtcNow.AddMonths(1)
                    };

                    _context.Assinaturas.Add(novaAssinatura);
                    await _context.SaveChangesAsync();
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
                    excecaoPrincipal = ex.Message,
                    excecaoInterna = ex.InnerException?.Message,
                    checkoutAnalisado = checkoutId
                });
            }

            return Ok();
        }

        [HttpGet("verificar-status")]
        [Authorize]
        public async Task<IActionResult> VerificarStatus([FromQuery] string planoDesejado, [FromServices] TokenService tokenService)
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out int usuarioId))
            {
                return Unauthorized();
            }

            var assinaturaAtiva = await _context.Assinaturas
                .FirstOrDefaultAsync(a => a.UsuarioId == usuarioId 
                                       && a.Status == "Ativo" 
                                       && a.PlanoNome.ToLower() == planoDesejado.ToLower());

            if (assinaturaAtiva != null)
            {
                var usuario = await _context.Usuarios.FindAsync(usuarioId);
                if (usuario != null)
                {
                    var novoToken = tokenService.GenerateToken(usuario);
                    
                    return Ok(new { status = "pago", token = novoToken });
                }
            }

            return Ok(new { status = "pendente" });
        }
    }

    public class CheckoutDto
    {
        public string Plano { get; set; } = string.Empty;
        public string Metodo { get; set; } = string.Empty;
        public int UsuarioId { get; set; }
    }
}