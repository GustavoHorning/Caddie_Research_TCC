using CaddieResearch.Api.Data;
using CaddieResearch.Api.Models;
using CaddieResearch.Api.DTOs.MorningCall;
using CaddieResearch.Api.Interfaces;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace CaddieResearch.Api.Services;

public class MorningCallService : IMorningCallService
{
    private readonly AppDbContext _context;
    private readonly BlobService _blobService;
    private readonly INotificacaoService _notificacaoService;
    
    private static readonly string[] ExtensoesAudio = { ".mp4", ".m4a", ".mp3" };
    private const long TamanhoMaximoAudio = 25 * 1024 * 1024; // 25 MB corrigido

    public MorningCallService(AppDbContext context, BlobService blobService, INotificacaoService notificacaoService)
    {
        _context = context;
        _blobService = blobService;
        _notificacaoService = notificacaoService;
    }

    private static string? ValidarAudio(IFormFile audio)
    {
        var extensao = Path.GetExtension(audio.FileName).ToLowerInvariant();
        if (!ExtensoesAudio.Contains(extensao)) return "Formato de áudio inválido. Envie um arquivo .mp4, .m4a ou .mp3.";
        if (audio.Length > TamanhoMaximoAudio) return "O áudio deve ter no máximo 25 MB.";
        return null;
    }

    public async Task<List<MorningCallResultDto>> ObterTodosAsync()
    {
        return await _context.MorningCalls
            .Include(m => m.Gestor)
            .Include(m => m.Topicos)
            .OrderByDescending(m => m.Data)
            .ThenByDescending(m => m.DataCriacao)
            .Select(m => new MorningCallResultDto 
            {
                Id = m.Id,
                Titulo = m.Titulo,
                Data = m.Data,
                DataCriacao = m.DataCriacao,
                AudioUrl = m.AudioUrl,
                NomeGestor = m.Gestor!.Nome,
                Topicos = m.Topicos.OrderBy(t => t.Ordem).Select(t => new TopicoResultDto {
                    Id = t.Id, Titulo = t.Titulo, Texto = t.Texto, Link = t.Link, ImagemUrl = t.ImagemUrl
                }).ToList()
            }).ToListAsync();
    }

    public async Task<List<MorningCallResultDto>> ObterMeusAsync(int gestorId)
    {
        return await _context.MorningCalls
            .Include(m => m.Topicos)
            .Where(m => m.GestorId == gestorId)
            .OrderByDescending(m => m.Data)
            .ThenByDescending(m => m.DataCriacao)
            .Select(m => new MorningCallResultDto 
            {
                Id = m.Id, Titulo = m.Titulo, Data = m.Data, DataCriacao = m.DataCriacao, AudioUrl = m.AudioUrl, NomeGestor = "Eu",
                Topicos = m.Topicos.OrderBy(t => t.Ordem).Select(t => new TopicoResultDto {
                    Id = t.Id, Titulo = t.Titulo, Texto = t.Texto, Link = t.Link, ImagemUrl = t.ImagemUrl
                }).ToList()
            }).ToListAsync();
    }

    public async Task<(bool Sucesso, string Mensagem, int? Id)> CriarAsync(int gestorId, string titulo, string data, string topicosJson, IFormFile? audio, IFormFileCollection arquivosForm)
    {
        if (!DateTime.TryParse(data, out var dataConvertida)) return (false, "Data inválida.", null);

        List<TopicoInputDto>? topicosInput;
        try { topicosInput = JsonSerializer.Deserialize<List<TopicoInputDto>>(topicosJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }); }
        catch { return (false, "Formato inválido para os tópicos.", null); }

        if (topicosInput == null || topicosInput.Count == 0) return (false, "É necessário pelo menos um tópico.", null);

        if (audio != null && audio.Length > 0)
        {
            var erroAudio = ValidarAudio(audio);
            if (erroAudio != null) return (false, erroAudio, null);
        }

        var morningCall = new MorningCall { GestorId = gestorId, Titulo = titulo, Data = dataConvertida, DataCriacao = DateTime.UtcNow };

        if (audio != null && audio.Length > 0)
            morningCall.AudioUrl = await _blobService.UploadAudioAsync(audio, $"morningcall_{gestorId}");

        for (int i = 0; i < topicosInput.Count; i++)
        {
            var topicoInput = topicosInput[i];
            string? imagemUrl = topicoInput.ImagemUrlExistente;

            var arquivo = arquivosForm.GetFile($"imagem_{i}");
            if (arquivo != null && arquivo.Length > 0)
                imagemUrl = await _blobService.UploadImagemAsync(arquivo, $"morningcall_{gestorId}");

            morningCall.Topicos.Add(new MorningCallTopico { Titulo = topicoInput.Titulo, Texto = topicoInput.Texto, Link = topicoInput.Link, ImagemUrl = imagemUrl, Ordem = i });
        }

        _context.MorningCalls.Add(morningCall);
        await _context.SaveChangesAsync();
        await _notificacaoService.DispararNotificacaoMorningCallAsync(titulo);

        return (true, "Morning Call publicado com sucesso!", morningCall.Id);
    }

    public async Task<(bool Sucesso, string Mensagem)> AtualizarAsync(int id, int gestorId, string titulo, string data, string topicosJson, string? removerAudio, IFormFile? audio, IFormFileCollection arquivosForm)
    {
        var morningCall = await _context.MorningCalls.Include(m => m.Topicos).FirstOrDefaultAsync(m => m.Id == id && m.GestorId == gestorId);
        if (morningCall == null) return (false, "Morning Call não encontrado.");
        if (!DateTime.TryParse(data, out var dataConvertida)) return (false, "Data inválida.");

        List<TopicoInputDto>? topicosInput;
        try { topicosInput = JsonSerializer.Deserialize<List<TopicoInputDto>>(topicosJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }); }
        catch { return (false, "Formato inválido para os tópicos."); }

        if (topicosInput == null || topicosInput.Count == 0) return (false, "É necessário pelo menos um tópico.");

        if (audio != null && audio.Length > 0)
        {
            var erroAudio = ValidarAudio(audio);
            if (erroAudio != null) return (false, erroAudio);

            if (!string.IsNullOrEmpty(morningCall.AudioUrl)) await _blobService.ExcluirAudioAsync(morningCall.AudioUrl);
            morningCall.AudioUrl = await _blobService.UploadAudioAsync(audio, $"morningcall_{gestorId}");
        }
        else if (removerAudio == "true" && !string.IsNullOrEmpty(morningCall.AudioUrl))
        {
            await _blobService.ExcluirAudioAsync(morningCall.AudioUrl);
            morningCall.AudioUrl = null;
        }

        morningCall.Titulo = titulo;
        morningCall.Data = dataConvertida;

        var idsEnviados = topicosInput.Where(t => t.Id.HasValue).Select(t => t.Id!.Value).ToHashSet();
        var topicosParaRemover = morningCall.Topicos.Where(t => !idsEnviados.Contains(t.Id)).ToList();
        foreach (var topicoRemovido in topicosParaRemover)
        {
            if (!string.IsNullOrEmpty(topicoRemovido.ImagemUrl)) await _blobService.ExcluirImagemAsync(topicoRemovido.ImagemUrl);
            _context.MorningCallTopicos.Remove(topicoRemovido);
        }

        for (int i = 0; i < topicosInput.Count; i++)
        {
            var topicoInput = topicosInput[i];
            string? imagemUrl = topicoInput.ImagemUrlExistente;

            var arquivo = arquivosForm.GetFile($"imagem_{i}");
            if (arquivo != null && arquivo.Length > 0) imagemUrl = await _blobService.UploadImagemAsync(arquivo, $"morningcall_{gestorId}");

            if (topicoInput.Id.HasValue)
            {
                var topicoExistente = morningCall.Topicos.FirstOrDefault(t => t.Id == topicoInput.Id.Value);
                if (topicoExistente != null)
                {
                    topicoExistente.Titulo = topicoInput.Titulo; topicoExistente.Texto = topicoInput.Texto;
                    topicoExistente.Link = topicoInput.Link; topicoExistente.Ordem = i;

                    if (arquivo != null && arquivo.Length > 0)
                    {
                        if (!string.IsNullOrEmpty(topicoExistente.ImagemUrl)) await _blobService.ExcluirImagemAsync(topicoExistente.ImagemUrl);
                        topicoExistente.ImagemUrl = imagemUrl;
                    }
                    else if (!string.IsNullOrEmpty(topicoInput.ImagemUrlExistente)) topicoExistente.ImagemUrl = topicoInput.ImagemUrlExistente;
                }
            }
            else morningCall.Topicos.Add(new MorningCallTopico { Titulo = topicoInput.Titulo, Texto = topicoInput.Texto, Link = topicoInput.Link, ImagemUrl = imagemUrl, Ordem = i });
        }
        await _context.SaveChangesAsync();
        return (true, "Morning Call atualizado com sucesso!");
    }

    public async Task<(bool Sucesso, string Mensagem)> DeletarAsync(int id, int gestorId)
    {
        var morningCall = await _context.MorningCalls.Include(m => m.Topicos).FirstOrDefaultAsync(m => m.Id == id && m.GestorId == gestorId);
        if (morningCall == null) return (false, "Morning Call não encontrado.");

        foreach (var topico in morningCall.Topicos)
            if (!string.IsNullOrEmpty(topico.ImagemUrl)) await _blobService.ExcluirImagemAsync(topico.ImagemUrl);

        if (!string.IsNullOrEmpty(morningCall.AudioUrl)) await _blobService.ExcluirAudioAsync(morningCall.AudioUrl);

        _context.MorningCalls.Remove(morningCall);
        await _context.SaveChangesAsync();
        return (true, "Morning Call excluído.");
    }

    public async Task<(bool Sucesso, string Mensagem)> DeletarTopicoAsync(int morningCallId, int topicoId, int gestorId)
    {
        var morningCall = await _context.MorningCalls.Include(m => m.Topicos).FirstOrDefaultAsync(m => m.Id == morningCallId && m.GestorId == gestorId);
        if (morningCall == null) return (false, "Morning Call não encontrado.");

        var topico = morningCall.Topicos.FirstOrDefault(t => t.Id == topicoId);
        if (topico == null) return (false, "Tópico não encontrado.");

        if (!string.IsNullOrEmpty(topico.ImagemUrl)) await _blobService.ExcluirImagemAsync(topico.ImagemUrl);
        _context.MorningCallTopicos.Remove(topico);
        await _context.SaveChangesAsync();
        return (true, "Notícia removida.");
    }
}