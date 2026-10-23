using CaddieResearch.Api.Data;
using CaddieResearch.Api.Models;
using CaddieResearch.Api.Services;
using CaddieResearch.Api.Interfaces; 
using CaddieResearch.Api.DTOs.Relatorios; 
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace CaddieResearch.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class RelatoriosController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly BlobService _blobService;
    private readonly IPdfService _pdfService; 
    private readonly INotificacaoService _notificacaoService; 
    private readonly IAssinaturaService _assinaturaService; 

    public RelatoriosController(
        AppDbContext context, 
        BlobService blobService, 
        IPdfService pdfService, 
        INotificacaoService notificacaoService, 
        IAssinaturaService assinaturaService)
    {
        _context = context;
        _blobService = blobService;
        _pdfService = pdfService;
        _notificacaoService = notificacaoService;
        _assinaturaService = assinaturaService;
    }

    private int ObterUsuarioLogadoId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(claim, out int id) ? id : 0;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var relatorios = await _context.Relatorios
            .Include(r => r.Carteira)
            .OrderByDescending(r => r.DataPublicacao)
            .Select(r => new RelatorioResultDto 
            {
                Id = r.Id,
                Titulo = r.Titulo,
                Assunto = r.Assunto,
                ConteudoTexto = r.ConteudoTexto,
                TagsAtivos = r.TagsAtivos,
                ArquivoPdfUrl = r.ArquivoPdfUrl,
                CarteiraId = r.CarteiraId,
                NomeCarteira = r.Carteira != null ? r.Carteira.Nome : "Geral",
                DataPublicacao = r.DataPublicacao
            })
            .ToListAsync();
            
        return Ok(relatorios);
    }

    [HttpPost]
    [Authorize(Roles = "Gestor")] 
    public async Task<IActionResult> Post([FromForm] string titulo, [FromForm] string assunto, [FromForm] string conteudoTexto, [FromForm] string? tagsAtivos, [FromForm] int carteiraId, IFormFile? arquivoPdf)
    {
        string? pdfUrl = null;
        string? pdfTextoExtraido = null;

        if (arquivoPdf != null)
        {
            pdfTextoExtraido = _pdfService.ExtrairTextoDoPdf(arquivoPdf); 
            pdfUrl = await _blobService.UploadPdfAsync(arquivoPdf);
        }

        var relatorio = new Relatorio
        {
            Titulo = titulo,
            Assunto = assunto,
            ConteudoTexto = conteudoTexto ?? "",
            TagsAtivos = tagsAtivos ?? "",
            CarteiraId = carteiraId,
            ArquivoPdfUrl = pdfUrl,
            ConteudoPdfTexto = pdfTextoExtraido 
        };

        _context.Relatorios.Add(relatorio);
        await _context.SaveChangesAsync();

        await _notificacaoService.DispararNotificacaoRelatorioAsync(
            carteiraId, 
            "📄 Novo Relatório Publicado", 
            $"O relatório '{titulo}' acabou de sair. Acesse para conferir as análises!"
        );

        return Ok(relatorio);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Gestor")]
    public async Task<IActionResult> Put(int id, [FromForm] string titulo, [FromForm] string assunto, [FromForm] string conteudoTexto, [FromForm] string? tagsAtivos, [FromForm] int carteiraId, IFormFile? arquivoPdf)
    {
        var relatorio = await _context.Relatorios.FindAsync(id);
        if (relatorio == null) return NotFound();

        relatorio.Titulo = titulo;
        relatorio.Assunto = assunto;
        relatorio.ConteudoTexto = conteudoTexto ?? "";
        relatorio.TagsAtivos = tagsAtivos ?? "";
        relatorio.CarteiraId = carteiraId;

        if (arquivoPdf != null)
        {
            if (!string.IsNullOrEmpty(relatorio.ArquivoPdfUrl))
                await _blobService.ExcluirPdfAsync(relatorio.ArquivoPdfUrl);
            
            relatorio.ConteudoPdfTexto = _pdfService.ExtrairTextoDoPdf(arquivoPdf); 
            relatorio.ArquivoPdfUrl = await _blobService.UploadPdfAsync(arquivoPdf);
        }

        await _context.SaveChangesAsync();

        await _notificacaoService.DispararNotificacaoRelatorioAsync(
            carteiraId, 
            "🔄 Relatório Atualizado", 
            $"O Gestor atualizou o conteúdo do relatório '{titulo}'."
        );

        return Ok(relatorio);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Gestor")]
    public async Task<IActionResult> Delete(int id)
    {
        var relatorio = await _context.Relatorios.FindAsync(id);
        if (relatorio == null) return NotFound();

        int carteiraId = relatorio.CarteiraId;
        string titulo = relatorio.Titulo;

        if (!string.IsNullOrEmpty(relatorio.ArquivoPdfUrl))
            await _blobService.ExcluirPdfAsync(relatorio.ArquivoPdfUrl);

        _context.Relatorios.Remove(relatorio);
        await _context.SaveChangesAsync();

        await _notificacaoService.DispararNotificacaoRelatorioAsync(
            carteiraId, 
            "🗑️ Relatório Removido", 
            $"O relatório '{titulo}' foi retirado do ar pelo Gestor."
        );

        return NoContent();
    }

    [HttpGet("{id}/download")]
    public async Task<IActionResult> Download(int id)
    {
        var relatorio = await _context.Relatorios.Include(r => r.Carteira).FirstOrDefaultAsync(r => r.Id == id);
        if (relatorio == null || string.IsNullOrEmpty(relatorio.ArquivoPdfUrl)) return NotFound("Relatório não encontrado ou sem anexo.");

        int usuarioId = ObterUsuarioLogadoId();
        if (usuarioId == 0) return Unauthorized("Você precisa estar logado.");

        int nivelAcessoUsuario = await _assinaturaService.ObterNivelAcessoAsync(usuarioId);
        int nivelExigido = relatorio.Carteira?.NivelAcesso ?? 1;

        if (nivelAcessoUsuario < nivelExigido)
        {
            return StatusCode(403, new { erro = "Acesso Negado", mensagem = $"Seu plano atual não permite acessar os relatórios da carteira {relatorio.Carteira?.Nome}." });
        }

        try
        {
            var stream = await _blobService.DownloadPdfAsync(relatorio.ArquivoPdfUrl);
            return File(stream, "application/pdf", $"{relatorio.Titulo}.pdf");
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Erro ao processar o arquivo no servidor: {ex.Message}");
        }
    }

    [HttpPost("{id}/revisado")]
    [Authorize]
    public async Task<IActionResult> MarcarRevisado(int id)
    {
        int usuarioId = ObterUsuarioLogadoId();
        if (usuarioId == 0) return Unauthorized();

        var jaRevisado = await _context.RelatoriosRevisados.AnyAsync(r => r.UsuarioId == usuarioId && r.RelatorioId == id);
        if (jaRevisado) return Ok(new { revisado = true });

        _context.RelatoriosRevisados.Add(new RelatorioRevisado { UsuarioId = usuarioId, RelatorioId = id, DataRevisado = DateTime.UtcNow });
        await _context.SaveChangesAsync();
        return Ok(new { revisado = true });
    }

    [HttpDelete("{id}/revisado")]
    [Authorize]
    public async Task<IActionResult> DesmarcarRevisado(int id)
    {
        int usuarioId = ObterUsuarioLogadoId();
        if (usuarioId == 0) return Unauthorized();

        var revisado = await _context.RelatoriosRevisados.FirstOrDefaultAsync(r => r.UsuarioId == usuarioId && r.RelatorioId == id);
        if (revisado != null)
        {
            _context.RelatoriosRevisados.Remove(revisado);
            await _context.SaveChangesAsync();
        }
        return Ok(new { revisado = false });
    }

    [HttpGet("revisados")]
    [Authorize]
    public async Task<IActionResult> GetRevisados()
    {
        int usuarioId = ObterUsuarioLogadoId();
        if (usuarioId == 0) return Unauthorized();

        var ids = await _context.RelatoriosRevisados.Where(r => r.UsuarioId == usuarioId).Select(r => r.RelatorioId).ToListAsync();
        return Ok(ids);
    }
}