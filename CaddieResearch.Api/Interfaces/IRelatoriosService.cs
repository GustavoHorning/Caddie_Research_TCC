using CaddieResearch.Api.DTOs.Relatorios;

namespace CaddieResearch.Api.Interfaces;

public interface IRelatoriosService
{
    Task<List<RelatorioResultDto>> ObterTodosAsync();
    Task<RelatorioResultDto> CriarAsync(string titulo, string assunto, string conteudoTexto, string? tagsAtivos, int carteiraId, IFormFile? arquivoPdf);
    Task<(bool Sucesso, string Mensagem, RelatorioResultDto? Relatorio)> AtualizarAsync(int id, string titulo, string assunto, string conteudoTexto, string? tagsAtivos, int carteiraId, IFormFile? arquivoPdf);
    Task<(bool Sucesso, string Mensagem)> DeletarAsync(int id);
    Task<(bool Sucesso, DownloadErrorDto? Erro, Stream? Stream, string? NomeArquivo)> DownloadPdfAsync(int relatorioId, int usuarioId);
    Task<bool> MarcarRevisadoAsync(int relatorioId, int usuarioId);
    Task<bool> DesmarcarRevisadoAsync(int relatorioId, int usuarioId);
    Task<List<int>> ObterRevisadosAsync(int usuarioId);
}