using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using CaddieResearch.Api.Interfaces;
using CaddieResearch.Api.DTOs.Busca;

namespace CaddieResearch.Api.Controllers;

/// <summary>
/// Gerencia o motor de busca global e unificado da plataforma.
/// </summary>
[Route("api/[controller]")]
[ApiController]
public class BuscasController : ControllerBase
{
    private readonly IBuscaService _buscaService;

    public BuscasController(IBuscaService buscaService)
    {
        _buscaService = buscaService;
    }

    /// <summary>
    /// Realiza uma pesquisa global em toda a plataforma.
    /// </summary>
    /// <remarks>
    /// Varre o banco de dados procurando o termo informado em Ativos, Carteiras, Relatórios e Fórum.
    /// Se o usuário estiver autenticado, a busca pode considerar preferências ou histórico pessoal para refinar os resultados.
    /// </remarks>
    /// <param name="termo">A palavra-chave ou termo a ser pesquisado. Exemplo: "Petrobras" ou "Dividendos"</param>
    /// <response code="200">Resultados da busca agrupados por categoria.</response>
    /// <response code="400">O parâmetro de busca está vazio ou inválido.</response>
    [HttpGet("global")]
    [ProducesResponseType(typeof(List<BuscaGlobalResultDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> BuscarGlobal([FromQuery] string termo)
    {
        if (string.IsNullOrWhiteSpace(termo)) 
            return BadRequest(new { erro = "O termo de busca não pode estar vazio." });

        int usuarioId = 0;
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        if (!string.IsNullOrEmpty(userIdClaim))
        {
            int.TryParse(userIdClaim, out usuarioId);
        }

        var resultados = await _buscaService.BuscarGlobalAsync(termo, usuarioId);

        return Ok(resultados);
    }
}