using CaddieResearch.Api.Data;
using CaddieResearch.Api.Models;
using CaddieResearch.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

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
            .ToListAsync();
            
        return Ok(relatorios);
    }

    [HttpPost]
    public async Task<IActionResult> Post([FromForm] string titulo, [FromForm] string assunto, [FromForm] string conteudoTexto, [FromForm] int carteiraId, IFormFile? arquivoPdf)
    {
        string? pdfUrl = null;
        if (arquivoPdf != null)
        {
            pdfUrl = await _blobService.UploadPdfAsync(arquivoPdf);
        }

        var relatorio = new Relatorio
        {
            Titulo = titulo,
            Assunto = assunto,
            ConteudoTexto = conteudoTexto ?? "",
            CarteiraId = carteiraId,
            ArquivoPdfUrl = pdfUrl
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
}