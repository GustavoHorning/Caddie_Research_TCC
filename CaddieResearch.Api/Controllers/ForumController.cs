using CaddieResearch.Api.DTOs.Forum;
using CaddieResearch.Api.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CaddieResearch.Api.Controllers;

[Route("api/forum")]
[ApiController]
[Authorize]
public class ForumController : ControllerBase
{
    private readonly IForumService _forumService;

    public ForumController(IForumService forumService)
    {
        _forumService = forumService;
    }

    private int ObterUsuarioLogadoId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(claim, out int id) ? id : 0;
    }

    private bool EhGestor() => User.IsInRole("Gestor");

    [HttpGet("categorias")]
    public IActionResult GetCategorias() => Ok(_forumService.ObterCategorias());

    [HttpGet("topicos")]
    public async Task<IActionResult> GetTopicos([FromQuery] string? categoria, [FromQuery] string? busca)
    {
        int usuarioId = ObterUsuarioLogadoId();
        if (usuarioId == 0) return Unauthorized();

        return Ok(await _forumService.ObterTopicosAsync(usuarioId, categoria, busca));
    }

    [HttpGet("topicos/{id}")]
    public async Task<IActionResult> GetTopico(int id)
    {
        int usuarioId = ObterUsuarioLogadoId();
        if (usuarioId == 0) return Unauthorized();

        var (sucesso, mensagem, topico) = await _forumService.ObterTopicoDetalheAsync(id, usuarioId, EhGestor());
        if (!sucesso) return NotFound(new { erro = mensagem });
        
        return Ok(topico);
    }

    [HttpPost("topicos")]
    public async Task<IActionResult> CriarTopico([FromBody] ForumTopicoRequestDto dto)
    {
        int usuarioId = ObterUsuarioLogadoId();
        if (usuarioId == 0) return Unauthorized();

        var (sucesso, mensagem, topicoId, status) = await _forumService.CriarTopicoAsync(usuarioId, EhGestor(), dto);
        if (!sucesso) return BadRequest(new { erro = mensagem });
        
        return Ok(new { id = topicoId, status, mensagem });
    }

    [HttpGet("meus-topicos")]
    public async Task<IActionResult> GetMeusTopicos()
    {
        int usuarioId = ObterUsuarioLogadoId();
        if (usuarioId == 0) return Unauthorized();

        return Ok(await _forumService.ObterMeusTopicosAsync(usuarioId));
    }

    [HttpGet("chamados")]
    [Authorize(Roles = "Gestor")]
    public async Task<IActionResult> GetChamados([FromQuery] string status = "Pendente")
    {
        var (chamados, contagem) = await _forumService.ObterChamadosAsync(status);
        return Ok(new { chamados, contagem });
    }

    [HttpPost("topicos/{id}/aprovar")]
    [Authorize(Roles = "Gestor")]
    public async Task<IActionResult> Aprovar(int id)
    {
        var (sucesso, mensagem) = await _forumService.AprovarTopicoAsync(id);
        if (!sucesso) return NotFound(new { erro = mensagem });
        
        return Ok(new { mensagem });
    }

    [HttpPost("topicos/{id}/recusar")]
    [Authorize(Roles = "Gestor")]
    public async Task<IActionResult> Recusar(int id, [FromBody] ForumRecusaRequestDto dto)
    {
        var (sucesso, mensagem) = await _forumService.RecusarTopicoAsync(id, dto.Motivo);
        if (!sucesso) return BadRequest(new { erro = mensagem });
        
        return Ok(new { mensagem });
    }

    [HttpDelete("topicos/{id}")]
    public async Task<IActionResult> ExcluirTopico(int id)
    {
        int usuarioId = ObterUsuarioLogadoId();
        if (usuarioId == 0) return Unauthorized();

        var (sucesso, mensagem) = await _forumService.ExcluirTopicoAsync(id, usuarioId, EhGestor());
        if (!sucesso) return BadRequest(new { erro = mensagem });
        
        return NoContent();
    }

    [HttpPost("topicos/{id}/respostas")]
    [RequestSizeLimit(30 * 1024 * 1024)]
    [RequestFormLimits(MultipartBodyLengthLimit = 30 * 1024 * 1024)]
    public async Task<IActionResult> Responder(int id, [FromForm] string? conteudo)
    {
        int usuarioId = ObterUsuarioLogadoId();
        if (usuarioId == 0) return Unauthorized();

        var anexos = Request.Form.Files.GetFiles("anexos").ToList();
        var audio = Request.Form.Files.GetFile("audio");

        var (sucesso, mensagem, respostaId) = await _forumService.ResponderTopicoAsync(id, usuarioId, EhGestor(), conteudo, anexos, audio);
        if (!sucesso) return BadRequest(new { erro = mensagem });
        
        return Ok(new { id = respostaId });
    }

    [HttpDelete("respostas/{id}")]
    public async Task<IActionResult> ExcluirResposta(int id)
    {
        int usuarioId = ObterUsuarioLogadoId();
        if (usuarioId == 0) return Unauthorized();

        var (sucesso, mensagem) = await _forumService.ExcluirRespostaAsync(id, usuarioId, EhGestor());
        if (!sucesso) return BadRequest(new { erro = mensagem });
        
        return NoContent();
    }

    [HttpPost("topicos/{id}/curtir")]
    public async Task<IActionResult> CurtirTopico(int id)
    {
        int usuarioId = ObterUsuarioLogadoId();
        if (usuarioId == 0) return Unauthorized();

        var (sucesso, mensagem, curtido, total) = await _forumService.CurtirTopicoAsync(id, usuarioId);
        if (!sucesso) return NotFound(new { erro = mensagem });
        
        return Ok(new { curtido, total });
    }

    [HttpPost("respostas/{id}/curtir")]
    public async Task<IActionResult> CurtirResposta(int id)
    {
        int usuarioId = ObterUsuarioLogadoId();
        if (usuarioId == 0) return Unauthorized();

        var (sucesso, mensagem, curtido, total) = await _forumService.CurtirRespostaAsync(id, usuarioId);
        if (!sucesso) return NotFound(new { erro = mensagem });
        
        return Ok(new { curtido, total });
    }
}