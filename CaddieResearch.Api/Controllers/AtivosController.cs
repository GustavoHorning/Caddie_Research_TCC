using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using CaddieResearch.Api.DTOs.Ativos;
using CaddieResearch.Api.Interfaces;

namespace CaddieResearch.Api.Controllers;

/// <summary>
/// Gerencia os ativos que compõem as carteiras recomendadas da plataforma.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class AtivosController : ControllerBase
{
    private readonly IAtivosService _ativosService;

    public AtivosController(IAtivosService ativosService)
    {
        _ativosService = ativosService;
    }

    private int ObterGestorId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(claim, out int id) ? id : 0;
    }

    /// <summary>
    /// Adiciona um novo ativo a uma carteira.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Gestor")] 
    [ProducesResponseType(typeof(AtivoResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CriarAtivo([FromBody] AtivoRequestDto dto) 
    {
        int gestorId = ObterGestorId();
        var (sucesso, mensagem, ativo) = await _ativosService.CriarAtivoAsync(gestorId, dto);

        if (!sucesso) return BadRequest(new { erro = mensagem });

        // Retorna apenas o objeto do Ativo para o Swagger desenhar corretamente
        return Ok(ativo); 
    }
    
    /// <summary>
    /// Atualiza os parâmetros de um ativo existente.
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "Gestor")] 
    [ProducesResponseType(typeof(AtivoResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AtualizarAtivo(int id, [FromBody] AtivoRequestDto dto) 
    {
        int gestorId = ObterGestorId();
        var (sucesso, mensagem, ativo) = await _ativosService.AtualizarAtivoAsync(id, gestorId, dto);

        if (!sucesso)
        {
            if (mensagem.Contains("não encontrado")) return NotFound(new { erro = mensagem });
            return BadRequest(new { erro = mensagem });
        }

        return Ok(ativo);
    }

    /// <summary>
    /// Remove um ativo de uma carteira recomendada.
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "Gestor")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeletarAtivo(int id)
    {
        int gestorId = ObterGestorId();
        var (sucesso, mensagem) = await _ativosService.DeletarAtivoAsync(id, gestorId);

        if (!sucesso) return NotFound(new { erro = mensagem });

        return Ok(new { mensagem });
    }
}