using CaddieResearch.Api.Data;
using CaddieResearch.Api.Models;
using CaddieResearch.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text;
using UglyToad.PdfPig;

namespace CaddieResearch.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class RelatoriosController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly BlobService _blobService;

    public RelatoriosController(AppDbContext context, BlobService blobService)
    {
        _context = context;
        _blobService = blobService;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var relatorios = await _context.Relatorios
            .Include(r => r.Carteira)
            .OrderByDescending(r => r.DataPublicacao)
            .Select(r => new 
            {
                r.Id,
                r.Titulo,
                r.Assunto,
                r.ConteudoTexto,
                r.ArquivoPdfUrl,
                r.CarteiraId,
                r.Carteira,
                r.DataPublicacao
            })
            .ToListAsync();
            
        return Ok(relatorios);
    }

    [HttpGet("busca")]
    public async Task<IActionResult> Buscar([FromQuery] string termo)
    {
        if (string.IsNullOrWhiteSpace(termo)) 
            return BadRequest("O termo de busca não pode estar vazio.");

        int nivelAcessoUsuario = 0; 
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        if (!string.IsNullOrEmpty(userIdClaim))
        {
            int usuarioId = int.Parse(userIdClaim);
            var usuario = await _context.Usuarios
                .Include(u => u.Assinaturas)
                .FirstOrDefaultAsync(u => u.Id == usuarioId);

            if (usuario != null)
            {
                if (usuario.TipoPerfil == "Gestor")
                {
                    nivelAcessoUsuario = 999; 
                }
                else
                {
                    var statusAtivo = "Ativo";
                    var assinaturaAtiva = usuario.Assinaturas?.FirstOrDefault(a => a.Status == statusAtivo);
                    string plano = "";

                    if (!string.IsNullOrEmpty(usuario.Plano))
                    {
                        plano = usuario.Plano.ToLower();
                    }
                    else if (assinaturaAtiva != null)
                    {
                        plano = assinaturaAtiva.PlanoNome.ToLower();
                    }

                    if (plano.Contains("black")) nivelAcessoUsuario = 3;
                    else if (plano.Contains("premium")) nivelAcessoUsuario = 2;
                    else if (plano.Contains("basic")) nivelAcessoUsuario = 1;
                }
            }
        }

        var resultados = await _context.Relatorios
            .Include(r => r.Carteira)
            .Where(r => 
                r.Titulo.Contains(termo) || 
                r.Assunto.Contains(termo) ||
                (nivelAcessoUsuario >= (r.Carteira != null ? r.Carteira.NivelAcesso : 1) && 
                 (r.ConteudoTexto.Contains(termo) || (r.ConteudoPdfTexto != null && r.ConteudoPdfTexto.Contains(termo))))
            )
            .OrderByDescending(r => r.DataPublicacao)
            .Select(r => new 
            {
                r.Id,
                r.Titulo,
                r.Assunto,
                r.ConteudoTexto,
                r.ArquivoPdfUrl,
                r.CarteiraId,
                r.Carteira,
                r.DataPublicacao
            })
            .ToListAsync();

        return Ok(resultados);
    }

    [HttpPost]
    public async Task<IActionResult> Post([FromForm] string titulo, [FromForm] string assunto, [FromForm] string conteudoTexto, [FromForm] int carteiraId, IFormFile? arquivoPdf)
    {
        string? pdfUrl = null;
        string? pdfTextoExtraido = null;

        if (arquivoPdf != null)
        {
            pdfTextoExtraido = ExtrairTextoDoPdf(arquivoPdf);
            pdfUrl = await _blobService.UploadPdfAsync(arquivoPdf);
        }

        var relatorio = new Relatorio
        {
            Titulo = titulo,
            Assunto = assunto,
            ConteudoTexto = conteudoTexto ?? "",
            CarteiraId = carteiraId,
            ArquivoPdfUrl = pdfUrl,
            ConteudoPdfTexto = pdfTextoExtraido 
        };

        _context.Relatorios.Add(relatorio);
        await _context.SaveChangesAsync();

        return Ok(relatorio);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Put(int id, [FromForm] string titulo, [FromForm] string assunto, [FromForm] string conteudoTexto, [FromForm] int carteiraId, IFormFile? arquivoPdf)
    {
        var relatorio = await _context.Relatorios.FindAsync(id);
        if (relatorio == null) return NotFound();

        relatorio.Titulo = titulo;
        relatorio.Assunto = assunto;
        relatorio.ConteudoTexto = conteudoTexto ?? "";
        relatorio.CarteiraId = carteiraId;

        if (arquivoPdf != null)
        {
            if (!string.IsNullOrEmpty(relatorio.ArquivoPdfUrl))
                await _blobService.ExcluirPdfAsync(relatorio.ArquivoPdfUrl);
            
            relatorio.ConteudoPdfTexto = ExtrairTextoDoPdf(arquivoPdf);
            relatorio.ArquivoPdfUrl = await _blobService.UploadPdfAsync(arquivoPdf);
        }

        await _context.SaveChangesAsync();
        return Ok(relatorio);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var relatorio = await _context.Relatorios.FindAsync(id);
        if (relatorio == null) return NotFound();

        if (!string.IsNullOrEmpty(relatorio.ArquivoPdfUrl))
            await _blobService.ExcluirPdfAsync(relatorio.ArquivoPdfUrl);

        _context.Relatorios.Remove(relatorio);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpGet("{id}/download")]
    public async Task<IActionResult> Download(int id)
    {
        var relatorio = await _context.Relatorios
            .Include(r => r.Carteira)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (relatorio == null || string.IsNullOrEmpty(relatorio.ArquivoPdfUrl)) 
            return NotFound("Relatório não encontrado ou sem anexo.");

        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim)) 
            return Unauthorized("Você precisa estar logado.");

        int usuarioId = int.Parse(userIdClaim);
        var usuario = await _context.Usuarios
            .Include(u => u.Assinaturas)
            .FirstOrDefaultAsync(u => u.Id == usuarioId);

        if (usuario == null) return Unauthorized();

        int nivelAcessoUsuario = 0;
        if (usuario.TipoPerfil == "Gestor")
        {
            nivelAcessoUsuario = 999;
        }
        else
        {
            var statusAtivo = "Ativo";
            var Black = "black";
            var Premium = "premium";
            var Basic = "basic";
            var assinaturaAtiva = usuario.Assinaturas?.FirstOrDefault(a => a.Status == statusAtivo);
            string plano = "";

            if (!string.IsNullOrEmpty(usuario.Plano))
            {
                plano = usuario.Plano.ToLower();
            }
            else if (assinaturaAtiva != null)
            {
                plano = assinaturaAtiva.PlanoNome.ToLower();
            }

            if (plano.Contains(Black)) nivelAcessoUsuario = 3;
            else if (plano.Contains(Premium)) nivelAcessoUsuario = 2;
            else if (plano.Contains(Basic)) nivelAcessoUsuario = 1;
        }

        int nivelExigido = relatorio.Carteira?.NivelAcesso ?? 1;

        if (nivelAcessoUsuario < nivelExigido)
        {
            return StatusCode(403, new { 
                erro = "Acesso Negado", 
                mensagem = $"Seu plano atual não permite acessar os relatórios da carteira {relatorio.Carteira?.Nome}." 
            });
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

    private string? ExtrairTextoDoPdf(IFormFile arquivoPdf)
    {
        try
        {
            using var stream = arquivoPdf.OpenReadStream();
            using var pdf = PdfDocument.Open(stream);
            var sb = new StringBuilder();

            foreach (var pagina in pdf.GetPages())
            {
                sb.AppendLine(pagina.Text);
            }

            return sb.ToString();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[ERRO DE INDEXAÇÃO PDF]: {ex.Message}");
            return null; 
        }
    }
}