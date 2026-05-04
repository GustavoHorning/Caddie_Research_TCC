using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using CaddieResearch.Api.Services;
using CaddieResearch.Api.Data;
using CaddieResearch.Api.Models;
using System.Security.Claims;
using System.Threading.Tasks;
using System;
using System.IO;
using System.Text.Json;

namespace CaddieResearch.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PagamentoController : ControllerBase
    {
        private readonly AbacatePayService _abacatePayService;
        private readonly AppDbContext _context;
        private readonly TokenService _tokenService;

        public PagamentoController(AbacatePayService abacatePayService, AppDbContext context, TokenService tokenService)
        {
            _abacatePayService = abacatePayService;
            _context = context;
            _tokenService = tokenService;
        }

        private int ObterUsuarioLogadoId()
        {
            var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(idClaim, out int id) ? id : 0;
        }

        [Authorize]
        [HttpPost("checkout")]
        public async Task<IActionResult> CriarCheckout([FromBody] CheckoutRequestDto dto)
        {
            try
            {
                int usuarioId = ObterUsuarioLogadoId();
                var urlCheckout = await _abacatePayService.GerarCheckoutAsync(dto.Plano, dto.Metodo, usuarioId);
                return Ok(new { url = urlCheckout });
            }
            catch (Exception ex)
            {
                return BadRequest(new { erro = "Falha ao gerar link de pagamento", detalhe = ex.Message });
            }
        }

        // ==========================================
        // 🛡️ WEBHOOK SEGURO DA ABACATEPAY
        // ==========================================
        [AllowAnonymous]
        [HttpPost("webhook")]
        public async Task<IActionResult> Webhook([FromQuery] string secret)
        {
            // Validação simples para evitar requisições falsas
            if (secret != "caddie2026") return Unauthorized();

            using var reader = new StreamReader(Request.Body);
            var body = await reader.ReadToEndAsync();
            
            try 
            {
                using var jsonDoc = JsonDocument.Parse(body);
                var root = jsonDoc.RootElement;
                
                if (root.TryGetProperty("event", out var eventType))
                {
                    string evt = eventType.GetString();
                    if (evt == "checkout.completed" || evt == "subscription.completed")
                    {
                        var data = root.GetProperty("data");
                        
                        // A CORREÇÃO AQUI: Procurar o "checkout" primeiro!
                        if (data.TryGetProperty("checkout", out var checkout))
                        {
                            if (checkout.TryGetProperty("metadata", out var metadata))
                            {
                                int usuarioId = int.Parse(metadata.GetProperty("idUsuario").GetString());
                                string planoEscolhido = metadata.GetProperty("planoEscolhido").GetString();

                                string planoFormatado = char.ToUpper(planoEscolhido[0]) + planoEscolhido.Substring(1).ToLower();

                                // Pega o método de pagamento
                                string metodoPgto = "Desconhecido";
                                if (metadata.TryGetProperty("metodoPagamento", out var metodoProp))
                                {
                                    metodoPgto = metodoProp.GetString();
                                    metodoPgto = char.ToUpper(metodoPgto[0]) + metodoPgto.Substring(1).ToLower();
                                }

                                var usuario = await _context.Usuarios.FindAsync(usuarioId);
                                if (usuario != null)
                                {
                                    // Atualiza a tabela Usuários!
                                    usuario.Plano = planoFormatado;

                                    // Cria a Assinatura com a coluna nova
                                    var assinatura = new Assinatura
                                    {
                                        UsuarioId = usuarioId,
                                        PlanoNome = planoFormatado,
                                        ValorPago = planoFormatado == "Black" ? 99.90m : (planoFormatado == "Premium" ? 59.90m : 29.90m),
                                        TipoPagamento = metodoPgto,
                                        DataInicio = DateTime.UtcNow,
                                        DataVencimento = DateTime.UtcNow.AddMonths(1),
                                        Status = "Ativo"
                                    };
                                    _context.Assinaturas.Add(assinatura);
                                    await _context.SaveChangesAsync();
                                }
                            }
                        }
                    }
                }
                return Ok(); // Responde OK rápido para a AbacatePay não reenviar
            }
            catch(Exception ex)
            {
                Console.WriteLine($"Erro no Webhook: {ex.Message}");
                return Ok();
            }
        }

        // ==========================================
        // 🔄 FRONT-END CHAMA ISSO PARA PEGAR O NOVO JWT
        // ==========================================
        [Authorize]
        [HttpGet("verificar-status")]
        public async Task<IActionResult> VerificarStatus([FromQuery] string planoDesejado)
        {
            int usuarioId = ObterUsuarioLogadoId();
            if (usuarioId == 0) return Unauthorized();

            var usuario = await _context.Usuarios.FindAsync(usuarioId);
            if (usuario == null) return NotFound();

            if (!string.IsNullOrEmpty(usuario.Plano) && usuario.Plano.Equals(planoDesejado, StringComparison.OrdinalIgnoreCase))
            {
                var novoToken = _tokenService.GenerateToken(usuario);
                return Ok(new { status = "pago", token = novoToken });
            }
            
            return Ok(new { status = "pendente" });
        }
    }

    public class CheckoutRequestDto
    {
        public string Plano { get; set; }
        public string Metodo { get; set; }
    }
}