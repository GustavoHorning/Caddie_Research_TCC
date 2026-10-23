using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using CaddieResearch.Api.Interfaces; 
using CaddieResearch.Api.DTOs.Recomendacoes; 

namespace CaddieResearch.Api.Controllers;

[Route("api/recomendacoes")]
[ApiController]
[Authorize]
public class RecomendacoesController : ControllerBase
{
    private readonly IRecomendacoesService _recomendacoesService; 

    public RecomendacoesController(IRecomendacoesService recomendacoesService)
    {
        _recomendacoesService = recomendacoesService;
    }

    private int GetUsuarioId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(claim, out int id) ? id : 0;
    }

    [HttpGet("minhas")]
    public async Task<IActionResult> GetMinhas()
    {
        var usuarioId = GetUsuarioId();
        if (usuarioId == 0) return Unauthorized();

        var recomendacoes = await _recomendacoesService.ObterMinhasRecomendacoesAsync(usuarioId);
        return Ok(recomendacoes);
    }

    [HttpGet("enviadas")]
    [Authorize(Roles = "Gestor")] 
    public async Task<IActionResult> GetEnviadas()
    {
        var gestorId = GetUsuarioId();
        if (gestorId == 0) return Unauthorized();

        var recomendacoes = await _recomendacoesService.ObterRecomendacoesEnviadasAsync(gestorId);
        return Ok(recomendacoes);
    }

    [HttpPost]
    [Authorize(Roles = "Gestor")] 
    public async Task<IActionResult> Criar([FromBody] RecomendacaoRequestDto dto)
    {
        var gestorId = GetUsuarioId();
        if (gestorId == 0) return Unauthorized();

        var recomendacao = await _recomendacoesService.CriarRecomendacaoAsync(gestorId, dto);
        return Ok(recomendacao);
    }

    [HttpPost("{id}/aderir")]
    public async Task<IActionResult> Aderir(int id)
    {
        var clienteId = GetUsuarioId();
        if (clienteId == 0) return Unauthorized();

        var (sucesso, mensagem, posicao) = await _recomendacoesService.AderirRecomendacaoAsync(id, clienteId);

        if (!sucesso) return BadRequest(new { erro = mensagem });

        return Ok(new { mensagem, posicao });
    }

    [HttpPost("{id}/recusar")]
    public async Task<IActionResult> Recusar(int id)
    {
        var clienteId = GetUsuarioId();
        if (clienteId == 0) return Unauthorized();

        var (sucesso, mensagem) = await _recomendacoesService.RecusarRecomendacaoAsync(id, clienteId);

        if (!sucesso) return BadRequest(new { erro = mensagem });

        return Ok(new { mensagem });
    }

    [HttpGet("clientes")]
    [Authorize(Roles = "Gestor")] 
    public async Task<IActionResult> GetClientes()
    {
        var clientes = await _recomendacoesService.ObterClientesParaRecomendacaoAsync();
        return Ok(clientes);
    }
}