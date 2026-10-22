using CaddieResearch.Api.Data;
using CaddieResearch.Api.Models;
using CaddieResearch.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text;
using UglyToad.PdfPig;
using Microsoft.AspNetCore.SignalR;
using CaddieResearch.Api.Hubs;
using System;
using System.Collections.Generic;
using System.Linq;

namespace CaddieResearch.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class RelatoriosController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly BlobService _blobService;
    private readonly IHubContext<NotificationHub> _hubContext; 

    public RelatoriosController(AppDbContext context, BlobService blobService, IHubContext<NotificationHub> hubContext)
    {
        _context = context;
        _blobService = blobService;
        _hubContext = hubContext; 
    }

    /// <summary>
    /// Lista todos os relatórios e teses de investimentos publicados (Acesso Geral).
    /// </summary>
    /// <remarks>
    /// Retorna a lista de relatórios disponíveis no sistema, incluindo o conteúdo textual e as tags para indexação no motor de busca (Omnisearch).
    /// </remarks>
    [HttpGet]
    [ProducesResponseType(200)]
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
                r.TagsAtivos,
                r.ArquivoPdfUrl,
                r.CarteiraId,
                r.Carteira,
                r.DataPublicacao
            })
            .ToListAsync();
            
        return Ok(relatorios);
    }

    /// <summary>
    /// Publica um novo Relatório de Investimentos com anexo em PDF (Acesso Gestor).
    /// </summary>
    /// <remarks>
    /// Processo complexo que: 1) Faz upload do arquivo para o Azure Blob Storage; 2) Extrai todo o texto interno do PDF (via PdfPig) para indexação invisível na busca global; 3) Vincula o relatório ao Paywall da carteira e 4) Dispara notificações SignalR.
    /// </remarks>
    /// <param name="titulo">O título do relatório. Ex: 'Início de Cobertura: WEGE3'</param>
    /// <param name="assunto">Tema principal. Ex: 'Ações B3'</param>
    /// <param name="conteudoTexto">Resumo do relatório.</param>
    /// <param name="tagsAtivos">Tickers relacionados. Ex: 'WEGE3,VALE3'</param>
    /// <param name="carteiraId">ID da carteira (define o Paywall do relatório).</param>
    /// <param name="arquivoPdf">O arquivo físico em PDF.</param>
    [HttpPost]
    [ProducesResponseType(200)]
    public async Task<IActionResult> Post([FromForm] string titulo, [FromForm] string assunto, [FromForm] string conteudoTexto, [FromForm] string? tagsAtivos, [FromForm] int carteiraId, IFormFile? arquivoPdf)
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
            TagsAtivos = tagsAtivos ?? "",
            CarteiraId = carteiraId,
            ArquivoPdfUrl = pdfUrl,
            ConteudoPdfTexto = pdfTextoExtraido 
        };

        _context.Relatorios.Add(relatorio);
        await _context.SaveChangesAsync();

        await DispararNotificacaoRelatorioAsync(
            carteiraId, 
            "📄 Novo Relatório Publicado", 
            $"O relatório '{titulo}' acabou de sair. Acesse para conferir as análises!"
        );

        return Ok(relatorio);
    }

    /// <summary>
    /// Atualiza um relatório existente, reprocessando anexos se necessário (Acesso Gestor).
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]
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
            
            relatorio.ConteudoPdfTexto = ExtrairTextoDoPdf(arquivoPdf);
            relatorio.ArquivoPdfUrl = await _blobService.UploadPdfAsync(arquivoPdf);
        }

        await _context.SaveChangesAsync();

        await DispararNotificacaoRelatorioAsync(
            carteiraId, 
            "🔄 Relatório Atualizado", 
            $"O Gestor atualizou o conteúdo do relatório '{titulo}'."
        );

        return Ok(relatorio);
    }

    /// <summary>
    /// Exclui permanentemente um relatório e seu PDF hospedado.
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
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

        await DispararNotificacaoRelatorioAsync(
            carteiraId, 
            "🗑️ Relatório Removido", 
            $"O relatório '{titulo}' foi retirado do ar pelo Gestor."
        );

        return NoContent();
    }

    /// <summary>
    /// Realiza o download seguro do PDF original do relatório.
    /// </summary>
    /// <remarks>
    /// A rota é protegida pelo Paywall. Antes de iniciar o download via stream do Azure, a API verifica o nível da carteira do relatório e cruza com a assinatura vigente do usuário. O acesso é bloqueado se o plano for inferior.
    /// </remarks>
    /// <response code="200">Stream do arquivo PDF retornado.</response>
    /// <response code="403">O usuário logado não possui um plano de assinatura compatível.</response>
    [HttpGet("{id}/download")]
    [ProducesResponseType(200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Download(int id)
    {
        var relatorio = await _context.Relatorios.Include(r => r.Carteira).FirstOrDefaultAsync(r => r.Id == id);
        if (relatorio == null || string.IsNullOrEmpty(relatorio.ArquivoPdfUrl)) return NotFound("Relatório não encontrado ou sem anexo.");

        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized("Você precisa estar logado.");

        int usuarioId = int.Parse(userIdClaim);
        var usuario = await _context.Usuarios.Include(u => u.Assinaturas).FirstOrDefaultAsync(u => u.Id == usuarioId);
        if (usuario == null) return Unauthorized();

        int nivelAcessoUsuario = 0;
        if (usuario.TipoPerfil == "Gestor")
        {
            nivelAcessoUsuario = 999;
        }
        else
        {
            var statusAtivo = "Ativo";
            var assinaturaAtiva = usuario.Assinaturas?.FirstOrDefault(a => a.Status == statusAtivo);
            string plano = !string.IsNullOrEmpty(usuario.Plano) ? usuario.Plano.ToLower() : assinaturaAtiva?.PlanoNome.ToLower() ?? "";

            if (plano.Contains("black")) nivelAcessoUsuario = 3;
            else if (plano.Contains("premium")) nivelAcessoUsuario = 2;
            else if (plano.Contains("basic")) nivelAcessoUsuario = 1;
        }

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

    /// <summary>
    /// Marca o relatório como lido/revisado pelo usuário logado.
    /// </summary>
    [HttpPost("{id}/revisado")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    [ProducesResponseType(200)]
    public async Task<IActionResult> MarcarRevisado(int id)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdClaim, out int usuarioId)) return Unauthorized();

        var jaRevisado = await _context.RelatoriosRevisados.AnyAsync(r => r.UsuarioId == usuarioId && r.RelatorioId == id);
        if (jaRevisado) return Ok(new { revisado = true });

        _context.RelatoriosRevisados.Add(new RelatorioRevisado { UsuarioId = usuarioId, RelatorioId = id, DataRevisado = DateTime.UtcNow });
        await _context.SaveChangesAsync();
        return Ok(new { revisado = true });
    }

    /// <summary>
    /// Desmarca a tag de revisão (Volta para não lido).
    /// </summary>
    [HttpDelete("{id}/revisado")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    [ProducesResponseType(200)]
    public async Task<IActionResult> DesmarcarRevisado(int id)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdClaim, out int usuarioId)) return Unauthorized();

        var revisado = await _context.RelatoriosRevisados.FirstOrDefaultAsync(r => r.UsuarioId == usuarioId && r.RelatorioId == id);
        if (revisado != null)
        {
            _context.RelatoriosRevisados.Remove(revisado);
            await _context.SaveChangesAsync();
        }
        return Ok(new { revisado = false });
    }

    /// <summary>
    /// Retorna a lista de IDs de todos os relatórios que o usuário já revisou.
    /// </summary>
    [HttpGet("revisados")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    [ProducesResponseType(200)]
    public async Task<IActionResult> GetRevisados()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdClaim, out int usuarioId)) return Unauthorized();

        var ids = await _context.RelatoriosRevisados.Where(r => r.UsuarioId == usuarioId).Select(r => r.RelatorioId).ToListAsync();
        return Ok(ids);
    }

    private string? ExtrairTextoDoPdf(IFormFile arquivoPdf)
    {
        try
        {
            using var stream = arquivoPdf.OpenReadStream();
            using var pdf = PdfDocument.Open(stream);
            var sb = new StringBuilder();
            foreach (var pagina in pdf.GetPages()) sb.AppendLine(pagina.Text);
            return sb.ToString();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[ERRO DE INDEXAÇÃO PDF]: {ex.Message}");
            return null; 
        }
    }

    private async Task DispararNotificacaoRelatorioAsync(int carteiraId, string titulo, string mensagem)
    {
        try
        {
            var carteira = await _context.Carteiras.FindAsync(carteiraId);
            if (carteira == null) return;

            TimeZoneInfo fusoBrasilia;
            try { fusoBrasilia = TimeZoneInfo.FindSystemTimeZoneById("E. South America Standard Time"); }
            catch { fusoBrasilia = TimeZoneInfo.FindSystemTimeZoneById("America/Sao_Paulo"); }
            DateTime horaBrasilia = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, fusoBrasilia);

            var planosPermitidos = new List<string>();

            if (carteira.NivelAcesso <= 1) planosPermitidos.AddRange(new[] { "Basic", "Premium", "Black" });
            else if (carteira.NivelAcesso <= 2) planosPermitidos.AddRange(new[] { "Premium", "Black" });
            else planosPermitidos.Add("Black");

            var usuariosAlvoIds = await _context.Usuarios
                .Where(u => u.TipoPerfil == "Gestor" || 
                            _context.Assinaturas.Any(a => a.UsuarioId == u.Id 
                                                       && a.Status == "Ativo" 
                                                       && planosPermitidos.Contains(a.PlanoNome)))
                .Select(u => u.Id)
                .Distinct()
                .ToListAsync();

            var novasNotificacoes = new List<Notificacao>();

            foreach (var usuarioId in usuariosAlvoIds)
            {
                novasNotificacoes.Add(new Notificacao
                {
                    UsuarioId = usuarioId,
                    Titulo = titulo,
                    Mensagem = mensagem,
                    Tipo = "Conteudo",
                    LinkDestino = $"/relatorios", 
                    Lida = false,
                    DataCriacao = horaBrasilia
                });
            }

            if (novasNotificacoes.Any())
            {
                _context.Notificacoes.AddRange(novasNotificacoes);
                await _context.SaveChangesAsync();

                foreach (var notif in novasNotificacoes)
                {
                    await _hubContext.Clients.Group($"User_{notif.UsuarioId}")
                                     .SendAsync("ReceberNotificacao", notif);
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Erro ao disparar notificação centralizada: {ex.Message}");
        }
    }
}