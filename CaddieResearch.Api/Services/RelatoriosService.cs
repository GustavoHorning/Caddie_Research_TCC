using CaddieResearch.Api.Data;
using CaddieResearch.Api.Models;
using CaddieResearch.Api.DTOs.Relatorios;
using CaddieResearch.Api.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace CaddieResearch.Api.Services;

public class RelatoriosService : IRelatoriosService
{
    private readonly AppDbContext _context;
    private readonly BlobService _blobService;
    private readonly IPdfService _pdfService; 
    private readonly INotificacaoService _notificacaoService; 
    private readonly IAssinaturaService _assinaturaService;

    public RelatoriosService(
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

    public async Task<List<RelatorioResultDto>> ObterTodosAsync()
    {
        return await _context.Relatorios
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
            }).ToListAsync();
    }

    public async Task<RelatorioResultDto> CriarAsync(string titulo, string assunto, string conteudoTexto, string? tagsAtivos, int carteiraId, IFormFile? arquivoPdf)
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
            Titulo = titulo, Assunto = assunto, ConteudoTexto = conteudoTexto ?? "",
            TagsAtivos = tagsAtivos ?? "", CarteiraId = carteiraId,
            ArquivoPdfUrl = pdfUrl, ConteudoPdfTexto = pdfTextoExtraido, DataPublicacao = DateTime.UtcNow
        };

        _context.Relatorios.Add(relatorio);
        await _context.SaveChangesAsync();

        await _notificacaoService.DispararNotificacaoRelatorioAsync(carteiraId, "📄 Novo Relatório Publicado", $"O relatório '{titulo}' acabou de sair. Acesse para conferir as análises!");

        return new RelatorioResultDto { Id = relatorio.Id, Titulo = relatorio.Titulo, DataPublicacao = relatorio.DataPublicacao };
    }

    public async Task<(bool Sucesso, string Mensagem, RelatorioResultDto? Relatorio)> AtualizarAsync(int id, string titulo, string assunto, string conteudoTexto, string? tagsAtivos, int carteiraId, IFormFile? arquivoPdf)
    {
        var relatorio = await _context.Relatorios.FindAsync(id);
        if (relatorio == null) return (false, "Relatório não encontrado.", null);

        relatorio.Titulo = titulo; relatorio.Assunto = assunto;
        relatorio.ConteudoTexto = conteudoTexto ?? ""; relatorio.TagsAtivos = tagsAtivos ?? "";
        relatorio.CarteiraId = carteiraId;

        if (arquivoPdf != null)
        {
            if (!string.IsNullOrEmpty(relatorio.ArquivoPdfUrl)) await _blobService.ExcluirPdfAsync(relatorio.ArquivoPdfUrl);
            relatorio.ConteudoPdfTexto = _pdfService.ExtrairTextoDoPdf(arquivoPdf); 
            relatorio.ArquivoPdfUrl = await _blobService.UploadPdfAsync(arquivoPdf);
        }

        await _context.SaveChangesAsync();
        await _notificacaoService.DispararNotificacaoRelatorioAsync(carteiraId, "🔄 Relatório Atualizado", $"O Gestor atualizou o conteúdo do relatório '{titulo}'.");

        return (true, string.Empty, new RelatorioResultDto { Id = relatorio.Id, Titulo = relatorio.Titulo, DataPublicacao = relatorio.DataPublicacao });
    }

    public async Task<(bool Sucesso, string Mensagem)> DeletarAsync(int id)
    {
        var relatorio = await _context.Relatorios.FindAsync(id);
        if (relatorio == null) return (false, "Relatório não encontrado.");

        int carteiraId = relatorio.CarteiraId; string titulo = relatorio.Titulo;

        if (!string.IsNullOrEmpty(relatorio.ArquivoPdfUrl)) await _blobService.ExcluirPdfAsync(relatorio.ArquivoPdfUrl);

        _context.Relatorios.Remove(relatorio);
        await _context.SaveChangesAsync();

        await _notificacaoService.DispararNotificacaoRelatorioAsync(carteiraId, "🗑️ Relatório Removido", $"O relatório '{titulo}' foi retirado do ar pelo Gestor.");
        return (true, string.Empty);
    }

    public async Task<(bool Sucesso, DownloadErrorDto? Erro, Stream? Stream, string? NomeArquivo)> DownloadPdfAsync(int relatorioId, int usuarioId)
    {
        var relatorio = await _context.Relatorios.Include(r => r.Carteira).FirstOrDefaultAsync(r => r.Id == relatorioId);
        if (relatorio == null || string.IsNullOrEmpty(relatorio.ArquivoPdfUrl)) 
            return (false, new DownloadErrorDto { Erro = "Não encontrado", Mensagem = "Relatório sem anexo." }, null, null);

        int nivelAcessoUsuario = await _assinaturaService.ObterNivelAcessoAsync(usuarioId);
        int nivelExigido = relatorio.Carteira?.NivelAcesso ?? 1;

        if (nivelAcessoUsuario < nivelExigido)
            return (false, new DownloadErrorDto { Erro = "Acesso Negado", Mensagem = $"Seu plano atual não permite acessar os relatórios da carteira {relatorio.Carteira?.Nome}." }, null, null);

        try
        {
            var stream = await _blobService.DownloadPdfAsync(relatorio.ArquivoPdfUrl);
            return (true, null, stream, $"{relatorio.Titulo}.pdf");
        }
        catch (Exception ex)
        {
            return (false, new DownloadErrorDto { Erro = "Erro interno", Mensagem = ex.Message }, null, null);
        }
    }

    public async Task<bool> MarcarRevisadoAsync(int relatorioId, int usuarioId)
    {
        var jaRevisado = await _context.RelatoriosRevisados.AnyAsync(r => r.UsuarioId == usuarioId && r.RelatorioId == relatorioId);
        if (jaRevisado) return true;

        _context.RelatoriosRevisados.Add(new RelatorioRevisado { UsuarioId = usuarioId, RelatorioId = relatorioId, DataRevisado = DateTime.UtcNow });
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DesmarcarRevisadoAsync(int relatorioId, int usuarioId)
    {
        var revisado = await _context.RelatoriosRevisados.FirstOrDefaultAsync(r => r.UsuarioId == usuarioId && r.RelatorioId == relatorioId);
        if (revisado != null)
        {
            _context.RelatoriosRevisados.Remove(revisado);
            await _context.SaveChangesAsync();
        }
        return false;
    }

    public async Task<List<int>> ObterRevisadosAsync(int usuarioId)
    {
        return await _context.RelatoriosRevisados.Where(r => r.UsuarioId == usuarioId).Select(r => r.RelatorioId).ToListAsync();
    }
}