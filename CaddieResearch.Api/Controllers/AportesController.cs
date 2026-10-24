using CaddieResearch.Api.DTOs.Portfolio;
using CaddieResearch.Api.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CaddieResearch.Api.Controllers;

/// <summary>
/// Gerencia os aportes (depósitos) financeiros de um portfólio de investimentos.
/// </summary>
[Route("api/portfolio/{portfolioId:int}/aportes")]
[ApiController]
[Authorize]
public class AportesController : ControllerBase
{
    private readonly IAportesService _aportesService;

    public AportesController(IAportesService aportesService)
    {
        _aportesService = aportesService;
    }

    private int GetUsuarioId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(claim, out int id) ? id : 0;
    }

    /// <summary>
    /// Lista todos os aportes de um portfólio.
    /// </summary>
    /// <remarks>
    /// Retorna o histórico de depósitos realizados no portfólio especificado, ordenados do mais recente para o mais antigo. Requer que o portfólio pertença ao usuário logado.
    /// </remarks>
    /// <param name="portfolioId">ID numérico do portfólio.</param>
    /// <response code="200">Histórico de aportes recuperado com sucesso.</response>
    /// <response code="401">Usuário não está autenticado.</response>
    /// <response code="403">O portfólio não pertence ao usuário logado.</response>
    [HttpGet]
    [ProducesResponseType(typeof(List<AporteResultDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetAportes(int portfolioId)
    {
        var usuarioId = GetUsuarioId();
        if (usuarioId == 0) return Unauthorized();

        var (sucesso, mensagem, aportes) = await _aportesService.ObterAportesAsync(portfolioId, usuarioId);
        
        if (!sucesso) return Forbid(mensagem); 

        return Ok(aportes);
    }

    /// <summary>
    /// Cadastra um novo aporte no portfólio.
    /// </summary>
    /// <remarks>
    /// Registra um novo depósito financeiro no portfólio. É possível especificar a data exata do aporte e uma descrição opcional.
    /// </remarks>
    /// <param name="portfolioId">ID numérico do portfólio.</param>
    /// <param name="dto">Dados do aporte (valor, descrição, data).</param>
    /// <response code="200">Aporte cadastrado com sucesso.</response>
    /// <response code="401">Usuário não está autenticado.</response>
    /// <response code="403">O portfólio não pertence ao usuário logado.</response>
    [HttpPost]
    [ProducesResponseType(typeof(AporteResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CadastrarAporte(int portfolioId, [FromBody] AporteRequestDto dto)
    {
        var usuarioId = GetUsuarioId();
        if (usuarioId == 0) return Unauthorized();

        var (sucesso, mensagem, aporte) = await _aportesService.CadastrarAporteAsync(portfolioId, usuarioId, dto);
        
        if (!sucesso) return Forbid(mensagem);

        return Ok(aporte);
    }

    /// <summary>
    /// Remove um aporte existente.
    /// </summary>
    /// <remarks>
    /// Deleta permanentemente um registro de aporte financeiro do portfólio.
    /// </remarks>
    /// <param name="portfolioId">ID numérico do portfólio.</param>
    /// <param name="id">ID numérico do aporte a ser removido.</param>
    /// <response code="204">Aporte removido com sucesso.</response>
    /// <response code="401">Usuário não está autenticado.</response>
    /// <response code="404">Aporte não encontrado ou não pertence ao usuário.</response>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoverAporte(int portfolioId, int id)
    {
        var usuarioId = GetUsuarioId();
        if (usuarioId == 0) return Unauthorized();

        var (sucesso, mensagem) = await _aportesService.RemoverAporteAsync(portfolioId, id, usuarioId);
        
        if (!sucesso) return NotFound(new { erro = mensagem });

        return NoContent();
    }
}