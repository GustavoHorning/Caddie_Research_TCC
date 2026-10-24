using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CaddieResearch.Api.Interfaces; 
using CaddieResearch.Api.DTOs.Carteiras;

namespace CaddieResearch.Api.Controllers;

/// <summary>
/// Consulta e listagem das carteiras recomendadas da Caddie Research.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class CarteirasController : ControllerBase
{
    private readonly ICarteirasService _carteirasService; 

    public CarteirasController(ICarteirasService carteirasService)
    {
        _carteirasService = carteirasService;
    }

    private int ObterUsuarioLogadoId()
    {
        var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(idClaim, out int id) ? id : 0;
    }

    /// <summary>
    /// Retorna as carteiras recomendadas disponíveis para o usuário.
    /// </summary>
    /// <remarks>
    /// Consulta o plano ativo do usuário (Basic, Premium ou Black) e retorna apenas as carteiras cuja propriedade NivelAcesso seja igual ou inferior ao permitido pelo plano contratado.
    /// </remarks>
    /// <response code="200">Lista filtrada de carteiras retornada com sucesso.</response>
    /// <response code="401">Usuário não possui credenciais válidas.</response>
    [HttpGet]
    [Authorize]
    [ProducesResponseType(typeof(List<CarteiraResultDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetCarteiras()
    {
        int usuarioId = ObterUsuarioLogadoId();
        if (usuarioId == 0) return Unauthorized(new { erro = "Usuário não autenticado." });

        var (sucesso, mensagem, carteiras) = await _carteirasService.ObterCarteirasPermitidasAsync(usuarioId);

        return Ok(carteiras);
    }

    /// <summary>
    /// Retorna a composição detalhada de uma carteira específica.
    /// </summary>
    /// <remarks>
    /// Valida se o cliente possui acesso premium suficiente e, caso afirmativo, carrega os metadados da carteira juntamente com todos os ativos (ações/FIIs) que a compõem.
    /// </remarks>
    /// <param name="id">O ID exclusivo da carteira. Ex: 1 para "Ações B3".</param>
    /// <response code="200">Composição da carteira retornada com sucesso.</response>
    /// <response code="401">Usuário não possui credenciais válidas.</response>
    /// <response code="403">Plano inferior ao necessário para acessar esta carteira (Paywall ativo).</response>
    /// <response code="404">Carteira não encontrada.</response>
    [HttpGet("{id}")]
    [Authorize]
    [ProducesResponseType(typeof(CarteiraResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCarteira(int id)
    {
        int usuarioId = ObterUsuarioLogadoId();
        if (usuarioId == 0) return Unauthorized(new { erro = "Usuário não autenticado." });

        var (sucesso, mensagem, carteira) = await _carteirasService.ObterCarteiraDetalhadaAsync(id, usuarioId);

        if (!sucesso)
        {
            if (mensagem.Contains("não encontrada")) return NotFound(new { erro = mensagem });
            return StatusCode(403, new { erro = mensagem });
        }

        return Ok(carteira);
    }
}