using CaddieResearch.Api.DTOs.Calendario; 
using CaddieResearch.Api.Interfaces;    
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CaddieResearch.Api.Controllers;

/// <summary>
/// Gerencia a agenda de eventos, balanços, indicadores macroeconômicos e lives da plataforma.
/// </summary>
[Route("api/[controller]")]
[ApiController]
[Authorize]
public class CalendarioController : ControllerBase
{
    private readonly ICalendarioService _calendarioService;

    public CalendarioController(ICalendarioService calendarioService)
    {
        _calendarioService = calendarioService;
    }

    /// <summary>
    /// Lista todos os eventos futuros.
    /// </summary>
    /// <remarks>
    /// Retorna todos os eventos agendados (macro, balanços e institucionais) a partir da data atual.
    /// </remarks>
    /// <response code="200">Lista de eventos recuperada com sucesso.</response>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(List<EventoResultDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetEventos()
    {
        var eventos = await _calendarioService.ObterEventosAsync();
        return Ok(eventos);
    }

    /// <summary>
    /// Lista os 3 eventos futuros de maior impacto para o Dashboard.
    /// </summary>
    /// <remarks>
    /// Retorna uma lista reduzida focada na tela inicial, priorizando os eventos ordenados por gravidade/impacto.
    /// </remarks>
    /// <response code="200">Lista reduzida de eventos recuperada com sucesso.</response>
    [HttpGet("dashboard")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(List<EventoResultDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetEventosDashboard()
    {
        var eventos = await _calendarioService.ObterEventosDashboardAsync();
        return Ok(eventos);
    }
    
    /// <summary>
    /// Atualiza um evento institucional da Caddie.
    /// </summary>
    /// <remarks>
    /// Permite editar detalhes de um evento criado manualmente. É bloqueado para eventos externos (Balanço ou Macro). Dispara notificação push para os assinantes.
    /// </remarks>
    /// <param name="id">ID do evento a ser editado.</param>
    /// <param name="dto">Dados atualizados do evento.</param>
    /// <response code="200">Evento atualizado com sucesso.</response>
    /// <response code="400">Tentativa de edição de evento externo bloqueada.</response>
    /// <response code="404">Evento não encontrado.</response>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(EventoResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AtualizarEventoPeloGestor(int id, [FromBody] AtualizarEventoDto dto)
    {
        var (sucesso, mensagem, evento) = await _calendarioService.AtualizarEventoPeloGestorAsync(id, dto);

        if (!sucesso)
        {
            if (mensagem.Contains("não encontrado")) return NotFound(new { erro = mensagem });
            return BadRequest(new { erro = mensagem });
        }

        return Ok(evento);
    }

    /// <summary>
    /// Cria um novo evento institucional.
    /// </summary>
    /// <remarks>
    /// Agenda uma Live, Reunião ou Mentoria oficial da Caddie Research e dispara alerta para os usuários ativos via SignalR.
    /// </remarks>
    /// <param name="dto">Dados para criação do evento.</param>
    /// <response code="200">Evento criado com sucesso.</response>
    [HttpPost("caddie")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> CriarEventoCaddie([FromBody] CriarEventoCaddieDto dto)
    {
        var (sucesso, mensagem, eventoId) = await _calendarioService.CriarEventoCaddieAsync(dto);
        return Ok(new { message = mensagem, eventoId });
    }

    /// <summary>
    /// Remove um evento do calendário.
    /// </summary>
    /// <remarks>
    /// Deleta o registro definitivamente do banco de dados. Caso seja um evento "Caddie", notifica os assinantes sobre o cancelamento.
    /// </remarks>
    /// <param name="id">ID do evento a ser removido.</param>
    /// <response code="200">Evento removido com sucesso.</response>
    /// <response code="404">Evento não localizado.</response>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeletarEvento(int id)
    {
        var (sucesso, mensagem) = await _calendarioService.DeletarEventoAsync(id);

        if (!sucesso) return NotFound(new { erro = mensagem });

        return Ok(new { message = mensagem });
    }
}