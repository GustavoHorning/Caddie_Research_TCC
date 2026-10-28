using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using CaddieResearch.Api.Interfaces; 
using CaddieResearch.Api.DTOs.Recomendacoes; 

namespace CaddieResearch.Api.Controllers;

/// <summary>
/// Fluxo de envio, aceite e recusa de recomendações diretas entre gestor e cliente.
/// </summary>
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

    /// <summary>
    /// Lista as recomendações recebidas pelo cliente logado.
    /// </summary>
    [HttpGet("minhas")]
    [ProducesResponseType(typeof(IEnumerable<RecomendacaoResultDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMinhas()
    {
        var usuarioId = GetUsuarioId();
        if (usuarioId == 0) return Unauthorized();

        var recomendacoes = await _recomendacoesService.ObterMinhasRecomendacoesAsync(usuarioId);
        return Ok(recomendacoes);
    }

    /// <summary>
    /// Lista as recomendações enviadas por um Gestor (Painel Admin).
    /// </summary>
    [HttpGet("enviadas")]
    [Authorize(Roles = "Gestor")] 
    [ProducesResponseType(typeof(IEnumerable<RecomendacaoResultDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetEnviadas()
    {
        var gestorId = GetUsuarioId();
        if (gestorId == 0) return Unauthorized();

        var recomendacoes = await _recomendacoesService.ObterRecomendacoesEnviadasAsync(gestorId);
        return Ok(recomendacoes);
    }

    /// <summary>
    /// Envia uma nova recomendação de aporte para um cliente específico.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Gestor")] 
    [ProducesResponseType(typeof(RecomendacaoResultDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> Criar([FromBody] RecomendacaoRequestDto dto)
    {
        var gestorId = GetUsuarioId();
        if (gestorId == 0) return Unauthorized();

        var recomendacao = await _recomendacoesService.CriarRecomendacaoAsync(gestorId, dto);
        return Ok(recomendacao);
    }

    /// <summary>
    /// Aceita uma recomendação, adicionando o ativo diretamente no portfólio do cliente.
    /// </summary>
    [HttpPost("{id}/aderir")]
    [ProducesResponseType(typeof(AderirRecomendacaoResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Aderir(int id)
    {
        var clienteId = GetUsuarioId();
        if (clienteId == 0) return Unauthorized();

        var (sucesso, mensagem, posicao) = await _recomendacoesService.AderirRecomendacaoAsync(id, clienteId);

        if (!sucesso) return BadRequest(new AderirRecomendacaoResponseDto { Mensagem = mensagem });

        return Ok(new AderirRecomendacaoResponseDto { Mensagem = mensagem, Posicao = posicao });
    }

    /// <summary>
    /// Recusa uma recomendação pendente.
    /// </summary>
    [HttpPost("{id}/recusar")]
    [ProducesResponseType(typeof(AderirRecomendacaoResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Recusar(int id)
    {
        var clienteId = GetUsuarioId();
        if (clienteId == 0) return Unauthorized();

        var (sucesso, mensagem) = await _recomendacoesService.RecusarRecomendacaoAsync(id, clienteId);

        if (!sucesso) return BadRequest(new AderirRecomendacaoResponseDto { Mensagem = mensagem });

        return Ok(new AderirRecomendacaoResponseDto { Mensagem = mensagem });
    }

    /// <summary>
    /// Lista clientes elegíveis para receberem recomendações personalizadas.
    /// </summary>
    [HttpGet("clientes")]
    [Authorize(Roles = "Gestor")] 
    [ProducesResponseType(typeof(IEnumerable<ClienteResultDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetClientes()
    {
        var clientes = await _recomendacoesService.ObterClientesParaRecomendacaoAsync();
        return Ok(clientes);
    }
}