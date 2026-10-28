using CaddieResearch.Api.Interfaces;
using CaddieResearch.Api.DTOs.MorningCall;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CaddieResearch.Api.Controllers;

/// <summary>
/// Gerencia as edições diárias do Morning Call (Áudios e Notícias).
/// </summary>
[Route("api/morningcall")]
[ApiController]
[Authorize]
public class MorningCallController : ControllerBase
{
    private readonly IMorningCallService _morningCallService;

    public MorningCallController(IMorningCallService morningCallService)
    {
        _morningCallService = morningCallService;
    }

    private int GetUsuarioId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(claim, out int id) ? id : 0;
    }

    /// <summary>
    /// Lista todos os Morning Calls publicados.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<MorningCallResultDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Get()
    {
        return Ok(await _morningCallService.ObterTodosAsync());
    }

    /// <summary>
    /// Lista os Morning Calls criados pelo gestor logado.
    /// </summary>
    [HttpGet("meus")]
    [Authorize(Roles = "Gestor")]
    [ProducesResponseType(typeof(List<MorningCallResultDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMeus()
    {
        var gestorId = GetUsuarioId();
        if (gestorId == 0) return Unauthorized();

        return Ok(await _morningCallService.ObterMeusAsync(gestorId));
    }

    /// <summary>
    /// Publica uma nova edição do Morning Call com áudio e imagens.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Gestor")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(MorningCallResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Post([FromForm] string titulo, [FromForm] string data, [FromForm] string topicosJson)
    {
        var gestorId = GetUsuarioId();
        if (gestorId == 0) return Unauthorized();

        if (string.IsNullOrWhiteSpace(titulo)) return BadRequest(new MorningCallResponseDto { Mensagem = "O título é obrigatório." });

        var audio = Request.Form.Files.GetFile("audio");
        var arquivosExtras = Request.Form.Files;

        var (sucesso, mensagem, id) = await _morningCallService.CriarAsync(gestorId, titulo, data, topicosJson, audio, arquivosExtras);
        
        if (!sucesso) return BadRequest(new MorningCallResponseDto { Mensagem = mensagem });
        return Ok(new MorningCallResponseDto { Mensagem = mensagem, Id = id });
    }

    /// <summary>
    /// Atualiza uma edição existente do Morning Call.
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "Gestor")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(MorningCallResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Put(int id, [FromForm] string titulo, [FromForm] string data, [FromForm] string topicosJson, [FromForm] string? removerAudio = null)
    {
        var gestorId = GetUsuarioId();
        if (gestorId == 0) return Unauthorized();

        if (string.IsNullOrWhiteSpace(titulo)) return BadRequest(new MorningCallResponseDto { Mensagem = "O título é obrigatório." });

        var audio = Request.Form.Files.GetFile("audio");
        var arquivosExtras = Request.Form.Files;

        var (sucesso, mensagem) = await _morningCallService.AtualizarAsync(id, gestorId, titulo, data, topicosJson, removerAudio, audio, arquivosExtras);
        
        if (!sucesso) return BadRequest(new MorningCallResponseDto { Mensagem = mensagem });
        return Ok(new MorningCallResponseDto { Mensagem = mensagem });
    }

    /// <summary>
    /// Exclui permanentemente um Morning Call e todos os seus arquivos do Storage.
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "Gestor")]
    [ProducesResponseType(typeof(MorningCallResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id)
    {
        var gestorId = GetUsuarioId();
        if (gestorId == 0) return Unauthorized();

        var (sucesso, mensagem) = await _morningCallService.DeletarAsync(id, gestorId);
        
        if (!sucesso) return NotFound(new MorningCallResponseDto { Mensagem = mensagem });
        return Ok(new MorningCallResponseDto { Mensagem = mensagem });
    }

    /// <summary>
    /// Remove um tópico/notícia específico de um Morning Call.
    /// </summary>
    [HttpDelete("{morningCallId}/topicos/{topicoId}")]
    [Authorize(Roles = "Gestor")]
    [ProducesResponseType(typeof(MorningCallResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteTopico(int morningCallId, int topicoId)
    {
        var gestorId = GetUsuarioId();
        if (gestorId == 0) return Unauthorized();

        var (sucesso, mensagem) = await _morningCallService.DeletarTopicoAsync(morningCallId, topicoId, gestorId);
        
        if (!sucesso) return NotFound(new MorningCallResponseDto { Mensagem = mensagem });
        return Ok(new MorningCallResponseDto { Mensagem = mensagem });
    }
}