using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using CaddieResearch.Api.Interfaces; // <-- Importando a Interface

namespace CaddieResearch.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class BuscasController : ControllerBase
{
    private readonly IBuscaService _buscaService;

    public BuscasController(IBuscaService buscaService)
    {
        _buscaService = buscaService;
    }

    [HttpGet("global")]
    public async Task<IActionResult> BuscarGlobal([FromQuery] string termo)
    {
        if (string.IsNullOrWhiteSpace(termo)) 
            return BadRequest("O termo de busca não pode estar vazio.");

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