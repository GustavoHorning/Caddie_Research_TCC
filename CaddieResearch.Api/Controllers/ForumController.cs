using CaddieResearch.Api.DTOs.Forum;
using CaddieResearch.Api.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CaddieResearch.Api.Controllers;

/// <summary>
/// Gerencia o Fórum da comunidade, incluindo tópicos, respostas, moderação e curtidas.
/// </summary>
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

    /// <summary>
    /// Lista as categorias disponíveis no fórum.
    /// </summary>
    [HttpGet("categorias")]
    [ProducesResponseType(typeof(List<string>), StatusCodes.Status200OK)]
    public IActionResult GetCategorias() => Ok(_forumService.ObterCategorias());

    /// <summary>
    /// Lista os tópicos do fórum com suporte a filtros.
    /// </summary>
    [HttpGet("topicos")]
    [ProducesResponseType(typeof(List<ForumTopicoResultDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetTopicos([FromQuery] string? categoria, [FromQuery] string? busca)
    {
        int usuarioId = ObterUsuarioLogadoId();
        if (usuarioId == 0) return Unauthorized(new MensagemResponseDto { Mensagem = "Usuário não autenticado." });

        var topicos = await _forumService.ObterTopicosAsync(usuarioId, categoria, busca);
        return Ok(topicos);
    }

    /// <summary>
    /// Retorna os detalhes de um tópico específico, incluindo respostas.
    /// </summary>
    [HttpGet("topicos/{id}")]
    [ProducesResponseType(typeof(ForumTopicoDetalheResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetTopico(int id)
    {
        int usuarioId = ObterUsuarioLogadoId();
        if (usuarioId == 0) return Unauthorized();

        var (sucesso, mensagem, topico) = await _forumService.ObterTopicoDetalheAsync(id, usuarioId, EhGestor());
        
        if (!sucesso) return NotFound(new MensagemResponseDto { Mensagem = mensagem });
        return Ok(topico);
    }

    /// <summary>
    /// Cria um novo tópico no fórum.
    /// </summary>
    /// <remarks>
    /// Se o usuário for cliente, o tópico entra com status "Pendente" para moderação. Se for Gestor, é aprovado automaticamente.
    /// </remarks>
    [HttpPost("topicos")]
    [ProducesResponseType(typeof(CriarTopicoResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CriarTopico([FromBody] ForumTopicoRequestDto dto)
    {
        int usuarioId = ObterUsuarioLogadoId();
        if (usuarioId == 0) return Unauthorized();

        var (sucesso, mensagem, topicoId, status) = await _forumService.CriarTopicoAsync(usuarioId, EhGestor(), dto);
        
        if (!sucesso) return BadRequest(new MensagemResponseDto { Mensagem = mensagem });
        
        // Tratamento do nullable com ?? 0
        return Ok(new CriarTopicoResultDto { Id = topicoId ?? 0, Status = status, Mensagem = mensagem });
    }

    /// <summary>
    /// Lista os tópicos criados pelo usuário logado.
    /// </summary>
    [HttpGet("meus-topicos")]
    [ProducesResponseType(typeof(List<ForumTopicoResultDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMeusTopicos()
    {
        int usuarioId = ObterUsuarioLogadoId();
        if (usuarioId == 0) return Unauthorized();

        var topicos = await _forumService.ObterMeusTopicosAsync(usuarioId);
        return Ok(topicos);
    }

    /// <summary>
    /// Painel de moderação: Lista tópicos pendentes ou recusados (Restrito a Gestores).
    /// </summary>
    [HttpGet("chamados")]
    [Authorize(Roles = "Gestor")]
    [ProducesResponseType(typeof(ChamadosDashboardResultDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetChamados([FromQuery] string status = "Pendente")
    {
        var (chamados, contagem) = await _forumService.ObterChamadosAsync(status);
        
        // Conversão de IEnumerable para List incluída
        return Ok(new ChamadosDashboardResultDto { Chamados = chamados.ToList(), Contagem = contagem });
    }

    /// <summary>
    /// Aprova um tópico pendente na moderação (Restrito a Gestores).
    /// </summary>
    [HttpPost("topicos/{id}/aprovar")]
    [Authorize(Roles = "Gestor")]
    [ProducesResponseType(typeof(MensagemResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Aprovar(int id)
    {
        var (sucesso, mensagem) = await _forumService.AprovarTopicoAsync(id);
        
        if (!sucesso) return NotFound(new MensagemResponseDto { Mensagem = mensagem });
        return Ok(new MensagemResponseDto { Mensagem = mensagem });
    }

    /// <summary>
    /// Recusa um tópico na moderação informando o motivo (Restrito a Gestores).
    /// </summary>
    [HttpPost("topicos/{id}/recusar")]
    [Authorize(Roles = "Gestor")]
    [ProducesResponseType(typeof(MensagemResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Recusar(int id, [FromBody] ForumRecusaRequestDto dto)
    {
        var (sucesso, mensagem) = await _forumService.RecusarTopicoAsync(id, dto.Motivo);
        
        if (!sucesso) return BadRequest(new MensagemResponseDto { Mensagem = mensagem });
        return Ok(new MensagemResponseDto { Mensagem = mensagem });
    }

    /// <summary>
    /// Exclui um tópico. Gestores podem excluir qualquer tópico, clientes apenas os próprios.
    /// </summary>
    [HttpDelete("topicos/{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ExcluirTopico(int id)
    {
        int usuarioId = ObterUsuarioLogadoId();
        if (usuarioId == 0) return Unauthorized();

        var (sucesso, mensagem) = await _forumService.ExcluirTopicoAsync(id, usuarioId, EhGestor());
        
        if (!sucesso) return BadRequest(new MensagemResponseDto { Mensagem = mensagem });
        return NoContent();
    }

    /// <summary>
    /// Envia uma resposta em um tópico existente (Suporta texto, anexos em PDF/Imagem e Áudio).
    /// </summary>
    [HttpPost("topicos/{id}/respostas")]
    [RequestSizeLimit(30 * 1024 * 1024)] // 30 MB
    [RequestFormLimits(MultipartBodyLengthLimit = 30 * 1024 * 1024)]
    [ProducesResponseType(typeof(ResponderResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Responder(int id, [FromForm] string? conteudo)
    {
        int usuarioId = ObterUsuarioLogadoId();
        if (usuarioId == 0) return Unauthorized();

        var anexos = Request.Form.Files.GetFiles("anexos").ToList();
        var audio = Request.Form.Files.GetFile("audio");

        var (sucesso, mensagem, respostaId) = await _forumService.ResponderTopicoAsync(id, usuarioId, EhGestor(), conteudo, anexos, audio);
        
        if (!sucesso) return BadRequest(new MensagemResponseDto { Mensagem = mensagem });
        
        // Tratamento do nullable com ?? 0
        return Ok(new ResponderResultDto { Id = respostaId ?? 0 });
    }

    /// <summary>
    /// Exclui uma resposta de um tópico.
    /// </summary>
    [HttpDelete("respostas/{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ExcluirResposta(int id)
    {
        int usuarioId = ObterUsuarioLogadoId();
        if (usuarioId == 0) return Unauthorized();

        var (sucesso, mensagem) = await _forumService.ExcluirRespostaAsync(id, usuarioId, EhGestor());
        
        if (!sucesso) return BadRequest(new MensagemResponseDto { Mensagem = mensagem });
        return NoContent();
    }

    /// <summary>
    /// Adiciona ou remove o like do usuário em um tópico (Toggle).
    /// </summary>
    [HttpPost("topicos/{id}/curtir")]
    [ProducesResponseType(typeof(CurtirResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CurtirTopico(int id)
    {
        int usuarioId = ObterUsuarioLogadoId();
        if (usuarioId == 0) return Unauthorized();

        var (sucesso, mensagem, curtido, total) = await _forumService.CurtirTopicoAsync(id, usuarioId);
        
        if (!sucesso) return NotFound(new MensagemResponseDto { Mensagem = mensagem });
        return Ok(new CurtirResultDto { Curtido = curtido, Total = total });
    }

    /// <summary>
    /// Adiciona ou remove o like do usuário em uma resposta (Toggle).
    /// </summary>
    [HttpPost("respostas/{id}/curtir")]
    [ProducesResponseType(typeof(CurtirResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CurtirResposta(int id)
    {
        int usuarioId = ObterUsuarioLogadoId();
        if (usuarioId == 0) return Unauthorized();

        var (sucesso, mensagem, curtido, total) = await _forumService.CurtirRespostaAsync(id, usuarioId);
        
        if (!sucesso) return NotFound(new MensagemResponseDto { Mensagem = mensagem });
        return Ok(new CurtirResultDto { Curtido = curtido, Total = total });
    }
}