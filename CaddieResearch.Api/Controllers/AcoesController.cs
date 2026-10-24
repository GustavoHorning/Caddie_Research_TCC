using CaddieResearch.Api.DTOs.Acoes;
using CaddieResearch.Api.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CaddieResearch.Api.Controllers;

/// <summary>
/// Gerenciamento e consulta de ativos financeiros (B3 e Mercado Americano).
/// </summary>
[Route("api/[controller]")]
[ApiController]
public class AcoesController : ControllerBase
{
    private readonly IAcoesService _acoesService;

    public AcoesController(IAcoesService acoesService)
    {
        _acoesService = acoesService;
    }

    /// <summary>
    /// Busca a cotação em tempo real de uma ação (B3).
    /// </summary>
    [AllowAnonymous]
    [HttpGet("cotacao/{ticker}")]
    [ProducesResponseType(typeof(CotacaoResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetCotacao(string ticker)
    {
        if (string.IsNullOrWhiteSpace(ticker)) 
            return BadRequest(new { erro = "O parâmetro ticker é obrigatório." });

        var (sucesso, mensagem, cotacao) = await _acoesService.ObterCotacaoAsync(ticker);

        if (!sucesso)
        {
            if (mensagem.Contains("não encontrado"))
                return NotFound(new { erro = mensagem });
                
            return StatusCode(500, new { erro = mensagem });
        }

        return Ok(cotacao);
    }

    /// <summary>
    /// Lista todos os tickers disponíveis na B3.
    /// </summary>
    [AllowAnonymous]
    [HttpGet("disponiveis")] // <-- CORRIGIDO AQUI PARA MATCH COM O REACT
    [ProducesResponseType(typeof(List<string>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTickersDisponiveis()
    {
        var tickers = await _acoesService.ObterTickersDisponiveisAsync();
        return Ok(tickers);
    }

    /// <summary>
    /// Lista todos os tickers do mercado internacional (EUA).
    /// </summary>
    [AllowAnonymous]
    [HttpGet("disponiveis/internacionais")] // <-- CORRIGIDO AQUI PARA MATCH COM O REACT
    [ProducesResponseType(typeof(List<string>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTickersInternacionais()
    {
        var tickers = await _acoesService.ObterTickersInternacionaisAsync();
        return Ok(tickers);
    }
}