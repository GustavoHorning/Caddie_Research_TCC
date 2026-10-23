using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.SignalR;
using CaddieResearch.Api.Data;
using CaddieResearch.Api.Models;
using CaddieResearch.Api.DTOs.Forum;
using CaddieResearch.Api.Interfaces;
using CaddieResearch.Api.Hubs;

namespace CaddieResearch.Api.Services;

public class ForumService : IForumService
{
    private static readonly string[] Categorias = { "Análise", "Setup", "Educacional", "Psicologia", "Off-topic" };
    private const string ContainerAnexos = "forum-anexos";
    private const string ContainerAudios = "forum-audios";
    private const int MaxAnexos = 3;
    private const long MaxBytesAnexo = 5 * 1024 * 1024;
    private const long MaxBytesAudio = 20 * 1024 * 1024;
    private const long MaxBytesTotal = 28 * 1024 * 1024;

    private static readonly Dictionary<string, string> TiposAnexo = new()
    {
        [".pdf"] = "application/pdf", [".png"] = "image/png", [".jpg"] = "image/jpeg",
        [".jpeg"] = "image/jpeg", [".webp"] = "image/webp", [".xlsx"] = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        [".xls"] = "application/vnd.ms-excel", [".csv"] = "text/csv", [".docx"] = "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        [".doc"] = "application/msword", [".txt"] = "text/plain"
    };

    private static readonly string[] ExtensoesAudio = { ".mp4", ".m4a", ".mp3" };

    private readonly AppDbContext _context;
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly BlobService _blobService;

    public ForumService(AppDbContext context, IHubContext<NotificationHub> hubContext, BlobService blobService)
    {
        _context = context;
        _hubContext = hubContext;
        _blobService = blobService;
    }

    private async Task Notificar(int usuarioId, string titulo, string mensagem, string link)
    {
        var notificacao = new Notificacao
        {
            UsuarioId = usuarioId,
            Titulo = titulo,
            Mensagem = mensagem,
            Tipo = "Info",
            LinkDestino = link,
            DataCriacao = DateTime.UtcNow
        };
        _context.Notificacoes.Add(notificacao);
        await _context.SaveChangesAsync();
        await _hubContext.Clients.Group($"User_{usuarioId}").SendAsync("ReceberNotificacao", notificacao);
    }

    private async Task ExcluirArquivosDasRespostas(IEnumerable<ForumResposta> respostas)
    {
        foreach (var r in respostas)
        {
            if (!string.IsNullOrEmpty(r.AudioUrl))
                await _blobService.ExcluirAudioAsync(r.AudioUrl, ContainerAudios);
            
            foreach (var a in r.Anexos)
                await _blobService.ExcluirAnexoAsync(a.Url, ContainerAnexos);
        }
    }

    public IEnumerable<string> ObterCategorias() => Categorias;

    public async Task<IEnumerable<ForumTopicoResultDto>> ObterTopicosAsync(int usuarioId, string? categoria, string? busca)
    {
        var query = _context.ForumTopicos.Where(t => t.Status == ForumStatus.Publicado);

        if (!string.IsNullOrWhiteSpace(categoria))
            query = query.Where(t => t.Categoria == categoria);

        if (!string.IsNullOrWhiteSpace(busca))
        {
            var termo = busca.Trim();
            query = query.Where(t => t.Titulo.Contains(termo) || t.Conteudo.Contains(termo));
        }

        return await query
            .OrderByDescending(t => t.DataModeracao ?? t.DataCriacao)
            .Select(t => new ForumTopicoResultDto
            {
                Id = t.Id,
                Titulo = t.Titulo,
                Conteudo = t.Conteudo,
                Categoria = t.Categoria,
                Status = t.Status,
                Data = t.DataModeracao ?? t.DataCriacao,
                Autor = new ForumAutorDto { Nome = t.Autor!.Nome, TipoPerfil = t.Autor.TipoPerfil, FotoPerfilUrl = t.Autor.FotoPerfilUrl },
                TotalCurtidas = t.Curtidas.Count,
                TotalRespostas = t.Respostas.Count,
                CurtidoPorMim = t.Curtidas.Any(c => c.UsuarioId == usuarioId)
            })
            .ToListAsync();
    }

    public async Task<(bool Sucesso, string Mensagem, ForumTopicoDetalheResultDto? Topico)> ObterTopicoDetalheAsync(int id, int usuarioId, bool ehGestor)
    {
        var topico = await _context.ForumTopicos
            .Where(t => t.Id == id)
            .Select(t => new ForumTopicoDetalheResultDto
            {
                Id = t.Id,
                Titulo = t.Titulo,
                Conteudo = t.Conteudo,
                Categoria = t.Categoria,
                Status = t.Status,
                MotivoRecusa = t.MotivoRecusa,
                Data = t.DataModeracao ?? t.DataCriacao,
                Autor = new ForumAutorDto { Nome = t.Autor!.Nome, TipoPerfil = t.Autor.TipoPerfil, FotoPerfilUrl = t.Autor.FotoPerfilUrl },
                TotalCurtidas = t.Curtidas.Count,
                CurtidoPorMim = t.Curtidas.Any(c => c.UsuarioId == usuarioId),
                EhAutor = t.AutorId == usuarioId,
                UsuarioEhGestor = ehGestor,
                Respostas = t.Respostas
                    .OrderBy(r => r.DataCriacao)
                    .Select(r => new ForumRespostaResultDto
                    {
                        Id = r.Id,
                        Conteudo = r.Conteudo,
                        AudioUrl = r.AudioUrl,
                        DataCriacao = r.DataCriacao,
                        Autor = new ForumAutorDto { Nome = r.Autor!.Nome, TipoPerfil = r.Autor.TipoPerfil, FotoPerfilUrl = r.Autor.FotoPerfilUrl },
                        TotalCurtidas = r.Curtidas.Count,
                        CurtidoPorMim = r.Curtidas.Any(c => c.UsuarioId == usuarioId),
                        PodeExcluir = r.AutorId == usuarioId || ehGestor,
                        Anexos = r.Anexos
                            .OrderBy(a => a.Id)
                            .Select(a => (object)new { a.Id, a.NomeArquivo, a.Url, a.ContentType, a.TamanhoBytes })
                            .ToList()
                    })
                    .ToList()
            })
            .FirstOrDefaultAsync();

        if (topico == null) return (false, "Tópico não encontrado.", null);
        if (topico.Status != ForumStatus.Publicado && !topico.EhAutor && !ehGestor) return (false, "Tópico não encontrado.", null);

        return (true, string.Empty, topico);
    }

    public async Task<(bool Sucesso, string Mensagem, int? TopicoId, string? Status)> CriarTopicoAsync(int usuarioId, bool ehGestor, ForumTopicoRequestDto dto)
    {
        if (!Categorias.Contains(dto.Categoria)) return (false, "Categoria inválida.", null, null);

        var topico = new ForumTopico
        {
            AutorId = usuarioId,
            Titulo = dto.Titulo.Trim(),
            Conteudo = dto.Conteudo.Trim(),
            Categoria = dto.Categoria,
            Status = ehGestor ? ForumStatus.Publicado : ForumStatus.Pendente,
            DataCriacao = DateTime.UtcNow,
            DataModeracao = ehGestor ? DateTime.UtcNow : null
        };

        _context.ForumTopicos.Add(topico);
        await _context.SaveChangesAsync();

        if (!ehGestor)
        {
            var gestores = await _context.Usuarios.Where(u => u.TipoPerfil == "Gestor").Select(u => u.Id).ToListAsync();
            foreach (var gestorId in gestores)
                await Notificar(gestorId, "Novo chamado no Fórum", $"Tópico aguardando aprovação: {topico.Titulo}", "/gestor/forum");
        }

        string msg = ehGestor ? "Tópico publicado." : "Tópico enviado! Ele ficará visível para a comunidade após a aprovação do gestor.";
        return (true, msg, topico.Id, topico.Status);
    }

    public async Task<IEnumerable<ForumTopicoResultDto>> ObterMeusTopicosAsync(int usuarioId)
    {
        return await _context.ForumTopicos
            .Where(t => t.AutorId == usuarioId)
            .OrderByDescending(t => t.DataCriacao)
            .Select(t => new ForumTopicoResultDto
            {
                Id = t.Id,
                Titulo = t.Titulo,
                Categoria = t.Categoria,
                Status = t.Status,
                MotivoRecusa = t.MotivoRecusa,
                Data = t.DataCriacao,
                TotalRespostas = t.Respostas.Count,
                TotalCurtidas = t.Curtidas.Count
            })
            .ToListAsync();
    }

    public async Task<(IEnumerable<ForumTopicoResultDto> Chamados, Dictionary<string, int> Contagem)> ObterChamadosAsync(string status)
    {
        var query = _context.ForumTopicos.Where(t => t.Status == status);

        query = status == ForumStatus.Pendente
            ? query.OrderBy(t => t.DataCriacao)
            : query.OrderByDescending(t => t.DataModeracao ?? t.DataCriacao);

        var chamados = await query
            .Select(t => new ForumTopicoResultDto
            {
                Id = t.Id,
                Titulo = t.Titulo,
                Conteudo = t.Conteudo,
                Categoria = t.Categoria,
                Status = t.Status,
                MotivoRecusa = t.MotivoRecusa,
                Data = t.DataModeracao ?? t.DataCriacao,
                Autor = new ForumAutorDto { Nome = t.Autor!.Nome, TipoPerfil = t.Autor.TipoPerfil, FotoPerfilUrl = t.Autor.FotoPerfilUrl },
                TotalRespostas = t.Respostas.Count,
                TotalCurtidas = t.Curtidas.Count
            })
            .ToListAsync();

        var contagem = await _context.ForumTopicos
            .GroupBy(t => t.Status)
            .Select(g => new { Status = g.Key, Total = g.Count() })
            .ToDictionaryAsync(x => x.Status, x => x.Total);

        return (chamados, contagem);
    }

    public async Task<(bool Sucesso, string Mensagem)> AprovarTopicoAsync(int id)
    {
        var topico = await _context.ForumTopicos.FindAsync(id);
        if (topico == null) return (false, "Tópico não encontrado.");

        topico.Status = ForumStatus.Publicado;
        topico.MotivoRecusa = null;
        topico.DataModeracao = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        await Notificar(topico.AutorId, "Seu tópico foi publicado", topico.Titulo, $"/forum/topico/{topico.Id}");
        return (true, "Tópico publicado no fórum.");
    }

    public async Task<(bool Sucesso, string Mensagem)> RecusarTopicoAsync(int id, string motivo)
    {
        var topico = await _context.ForumTopicos.FindAsync(id);
        if (topico == null) return (false, "Tópico não encontrado.");

        topico.Status = ForumStatus.Recusado;
        topico.MotivoRecusa = motivo;
        topico.DataModeracao = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        await Notificar(topico.AutorId, "Seu tópico não foi aprovado", $"{topico.Titulo} — Motivo: {motivo}", "/forum");
        return (true, "Tópico recusado.");
    }

    public async Task<(bool Sucesso, string Mensagem)> ExcluirTopicoAsync(int id, int usuarioId, bool ehGestor)
    {
        var topico = await _context.ForumTopicos
            .Include(t => t.Respostas).ThenInclude(r => r.Anexos)
            .FirstOrDefaultAsync(t => t.Id == id);
        
        if (topico == null) return (false, "Tópico não encontrado.");
        if (topico.AutorId != usuarioId && !ehGestor) return (false, "Você não tem permissão para excluir este tópico.");

        await ExcluirArquivosDasRespostas(topico.Respostas);
        _context.ForumTopicos.Remove(topico);
        await _context.SaveChangesAsync();
        
        return (true, string.Empty);
    }

    public async Task<(bool Sucesso, string Mensagem, int? RespostaId)> ResponderTopicoAsync(int id, int usuarioId, bool ehGestor, string? conteudo, List<IFormFile> anexos, IFormFile? audio)
    {
        var texto = conteudo?.Trim() ?? "";

        if (texto.Length < 2 && anexos.Count == 0 && audio == null)
            return (false, "Escreva a sua resposta, anexe um arquivo ou envie um áudio.", null);

        if (audio != null)
        {
            if (!ehGestor) return (false, "Somente o gestor pode responder com áudio.", null);
            if (!ExtensoesAudio.Contains(Path.GetExtension(audio.FileName).ToLowerInvariant()))
                return (false, "Formato de áudio inválido. Envie .mp4, .m4a ou .mp3.", null);
            if (audio.Length > MaxBytesAudio) return (false, "O áudio deve ter no máximo 20 MB.", null);
        }

        if (anexos.Count > MaxAnexos) return (false, $"Envie no máximo {MaxAnexos} anexos por resposta.", null);

        foreach (var a in anexos)
        {
            if (!TiposAnexo.ContainsKey(Path.GetExtension(a.FileName).ToLowerInvariant()))
                return (false, $"Tipo de arquivo não permitido: {Path.GetFileName(a.FileName)}.", null);
            if (a.Length > MaxBytesAnexo)
                return (false, $"O arquivo {Path.GetFileName(a.FileName)} passa de 5 MB.", null);
        }

        if (anexos.Sum(a => a.Length) + (audio?.Length ?? 0) > MaxBytesTotal)
            return (false, "O total de arquivos da resposta passa de 28 MB.", null);

        var topico = await _context.ForumTopicos.FindAsync(id);
        if (topico == null) return (false, "Tópico não encontrado.", null);
        if (topico.Status != ForumStatus.Publicado)
            return (false, "Só é possível responder a tópicos publicados.", null);

        var resposta = new ForumResposta { TopicoId = id, AutorId = usuarioId, Conteudo = texto, DataCriacao = DateTime.UtcNow };

        try
        {
            if (audio != null) resposta.AudioUrl = await _blobService.UploadAudioAsync(audio, $"forum_{usuarioId}", ContainerAudios);

            foreach (var a in anexos)
            {
                var extensao = Path.GetExtension(a.FileName).ToLowerInvariant();
                var nome = Path.GetFileName(a.FileName);
                resposta.Anexos.Add(new ForumRespostaAnexo
                {
                    NomeArquivo = nome.Length > 255 ? nome[..255] : nome,
                    ContentType = TiposAnexo[extensao],
                    TamanhoBytes = a.Length,
                    Url = await _blobService.UploadAnexoAsync(a, TiposAnexo[extensao], ContainerAnexos)
                });
            }

            _context.ForumRespostas.Add(resposta);
            await _context.SaveChangesAsync();
        }
        catch
        {
            await ExcluirArquivosDasRespostas(new[] { resposta });
            throw;
        }

        if (topico.AutorId != usuarioId)
            await Notificar(topico.AutorId, "Nova resposta no seu tópico", topico.Titulo, $"/forum/topico/{topico.Id}");

        return (true, string.Empty, resposta.Id);
    }

    public async Task<(bool Sucesso, string Mensagem)> ExcluirRespostaAsync(int id, int usuarioId, bool ehGestor)
    {
        var resposta = await _context.ForumRespostas.Include(r => r.Anexos).FirstOrDefaultAsync(r => r.Id == id);
        if (resposta == null) return (false, "Resposta não encontrada.");
        if (resposta.AutorId != usuarioId && !ehGestor) return (false, "Você não tem permissão para excluir esta resposta.");

        await ExcluirArquivosDasRespostas(new[] { resposta });
        _context.ForumRespostas.Remove(resposta);
        await _context.SaveChangesAsync();
        return (true, string.Empty);
    }

    public async Task<(bool Sucesso, string Mensagem, bool Curtido, int Total)> CurtirTopicoAsync(int id, int usuarioId)
    {
        var publicado = await _context.ForumTopicos.AnyAsync(t => t.Id == id && t.Status == ForumStatus.Publicado);
        if (!publicado) return (false, "Tópico não encontrado.", false, 0);

        var curtida = await _context.ForumCurtidas.FirstOrDefaultAsync(c => c.TopicoId == id && c.UsuarioId == usuarioId);
        if (curtida == null) _context.ForumCurtidas.Add(new ForumCurtida { TopicoId = id, UsuarioId = usuarioId });
        else _context.ForumCurtidas.Remove(curtida);

        await _context.SaveChangesAsync();
        var total = await _context.ForumCurtidas.CountAsync(c => c.TopicoId == id);
        return (true, string.Empty, curtida == null, total);
    }

    public async Task<(bool Sucesso, string Mensagem, bool Curtido, int Total)> CurtirRespostaAsync(int id, int usuarioId)
    {
        var existe = await _context.ForumRespostas.AnyAsync(r => r.Id == id && r.Topico!.Status == ForumStatus.Publicado);
        if (!existe) return (false, "Resposta não encontrada.", false, 0);

        var curtida = await _context.ForumRespostaCurtidas.FirstOrDefaultAsync(c => c.RespostaId == id && c.UsuarioId == usuarioId);
        if (curtida == null) _context.ForumRespostaCurtidas.Add(new ForumRespostaCurtida { RespostaId = id, UsuarioId = usuarioId });
        else _context.ForumRespostaCurtidas.Remove(curtida);

        await _context.SaveChangesAsync();
        var total = await _context.ForumRespostaCurtidas.CountAsync(c => c.RespostaId == id);
        return (true, string.Empty, curtida == null, total);
    }
}