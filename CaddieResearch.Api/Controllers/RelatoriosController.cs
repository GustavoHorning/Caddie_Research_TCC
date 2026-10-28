using CaddieResearch.Api.Interfaces; 
using CaddieResearch.Api.DTOs.Relatorios; 
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace CaddieResearch.Api.Controllers;

/// <summary>
/// Gerencia as publicações e o Paywall dos relatórios semanais de análise de mercado.
/// </summary>
[Route("api/[controller]")]
[ApiController]
public class RelatoriosController : ControllerBase
{
    private readonly IRelatoriosService _relatoriosService;

    public RelatoriosController(IRelatoriosService relatoriosService)
    {
        _relatoriosService = relatoriosService;
    }

    private int ObterUsuarioLogadoId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(claim, out int id) ? id : 0;
    }

    /// <summary>
    /// Lista todos os relatórios publicados na plataforma.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<RelatorioResultDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Get()
    {
        return Ok(await _relatoriosService.ObterTodosAsync());
    }

    /// <summary>
    /// Publica um novo relatório, faz upload do PDF e dispara notificação (Push) para os assinantes.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Gestor")] 
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(RelatorioResultDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> Post([FromForm] string titulo, [FromForm] string assunto, [FromForm] string conteudoTexto, [FromForm] string? tagsAtivos, [FromForm] int carteiraId, IFormFile? arquivoPdf)
    {
        var relatorio = await _relatoriosService.CriarAsync(titulo, assunto, conteudoTexto, tagsAtivos, carteiraId, arquivoPdf);
        return Ok(relatorio);
    }

    /// <summary>
    /// Atualiza o conteúdo ou troca o PDF de um relatório existente.
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "Gestor")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(RelatorioResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(RelatorioResponseDto), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Put(int id, [FromForm] string titulo, [FromForm] string assunto, [FromForm] string conteudoTexto, [FromForm] string? tagsAtivos, [FromForm] int carteiraId, IFormFile? arquivoPdf)
    {
        var (sucesso, mensagem, relatorio) = await _relatoriosService.AtualizarAsync(id, titulo, assunto, conteudoTexto, tagsAtivos, carteiraId, arquivoPdf);
        
        if (!sucesso) return NotFound(new RelatorioResponseDto { Mensagem = mensagem });
        return Ok(relatorio);
    }

    /// <summary>
    /// Remove permanentemente um relatório e seu PDF do servidor (Azure).
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "Gestor")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(RelatorioResponseDto), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id)
    {
        var (sucesso, mensagem) = await _relatoriosService.DeletarAsync(id);
        
        if (!sucesso) return NotFound(new RelatorioResponseDto { Mensagem = mensagem });
        return NoContent();
    }

    /// <summary>
    /// Fornece o arquivo PDF para download. Valida estritamente se o usuário possui assinatura suficiente (Paywall).
    /// </summary>
    [HttpGet("{id}/download")]
    [Authorize]
    [ProducesResponseType(typeof(FileStreamResult), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(DownloadErrorDto), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(DownloadErrorDto), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Download(int id)
    {
        int usuarioId = ObterUsuarioLogadoId();
        if (usuarioId == 0) return Unauthorized();

        var (sucesso, erro, stream, nomeArquivo) = await _relatoriosService.DownloadPdfAsync(id, usuarioId);

        if (!sucesso)
        {
            if (erro!.Erro == "Acesso Negado") return StatusCode(403, erro);
            if (erro.Erro == "Erro interno") return StatusCode(500, erro);
            return NotFound(erro);
        }

        return File(stream!, "application/pdf", nomeArquivo!);
    }

    /// <summary>
    /// Marca um relatório como "lido" (revisado) para o usuário logado.
    /// </summary>
    [HttpPost("{id}/revisado")]
    [Authorize]
    [ProducesResponseType(typeof(RelatorioRevisadoDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> MarcarRevisado(int id)
    {
        int usuarioId = ObterUsuarioLogadoId();
        var status = await _relatoriosService.MarcarRevisadoAsync(id, usuarioId);
        return Ok(new RelatorioRevisadoDto { Revisado = status });
    }

    /// <summary>
    /// Desmarca o status de leitura de um relatório para o usuário logado.
    /// </summary>
    [HttpDelete("{id}/revisado")]
    [Authorize]
    [ProducesResponseType(typeof(RelatorioRevisadoDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> DesmarcarRevisado(int id)
    {
        int usuarioId = ObterUsuarioLogadoId();
        var status = await _relatoriosService.DesmarcarRevisadoAsync(id, usuarioId);
        return Ok(new RelatorioRevisadoDto { Revisado = status });
    }

    /// <summary>
    /// Retorna a lista de IDs de todos os relatórios que o usuário logado já leu.
    /// </summary>
    [HttpGet("revisados")]
    [Authorize]
    [ProducesResponseType(typeof(List<int>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRevisados()
    {
        int usuarioId = ObterUsuarioLogadoId();
        var ids = await _relatoriosService.ObterRevisadosAsync(usuarioId);
        return Ok(ids);
    }
}