using CaddieResearch.Api.Data;
using CaddieResearch.Api.Hubs;
using CaddieResearch.Api.Models;
using CaddieResearch.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace CaddieResearch.Api.Controllers;

// Fluxo: o cliente cria um tópico (Pendente) → o gestor recebe um chamado →
// o gestor aprova (Publicado, visível a todos os membros) ou recusa (Recusado, com motivo).
[Route("api/forum")]
[ApiController]
[Authorize]
public class ForumController : ControllerBase
{
    private static readonly string[] Categorias = { "Análise", "Setup", "Educacional", "Psicologia", "Off-topic" };

    private const string ContainerAnexos = "forum-anexos";
    private const string ContainerAudios = "forum-audios";
    private const int MaxAnexos = 3;
    private const long MaxBytesAnexo = 5 * 1024 * 1024;
    private const long MaxBytesAudio = 20 * 1024 * 1024;
    private const long MaxBytesTotal = 28 * 1024 * 1024;

    // O tipo do arquivo é decidido pela extensão, nunca pelo que o navegador informa.
    // HTML e SVG ficam de fora porque poderiam executar script ao serem abertos.
    private static readonly Dictionary<string, string> TiposAnexo = new()
    {
        [".pdf"] = "application/pdf",
        [".png"] = "image/png",
        [".jpg"] = "image/jpeg",
        [".jpeg"] = "image/jpeg",
        [".webp"] = "image/webp",
        [".xlsx"] = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        [".xls"] = "application/vnd.ms-excel",
        [".csv"] = "text/csv",
        [".docx"] = "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        [".doc"] = "application/msword",
        [".txt"] = "text/plain",
    };

    private static readonly string[] ExtensoesAudio = { ".mp4", ".m4a", ".mp3" };

    private readonly AppDbContext _context;
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly BlobService _blobService;

    public ForumController(AppDbContext context, IHubContext<NotificationHub> hubContext, BlobService blobService)
    {
        _context = context;
        _hubContext = hubContext;
        _blobService = blobService;
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

    private int GetUsuarioId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(claim, out int id) ? id : 0;
    }

    private async Task<Usuario?> GetUsuarioLogado()
    {
        var id = GetUsuarioId();
        return id == 0 ? null : await _context.Usuarios.FindAsync(id);
    }

    private static bool EhGestor(Usuario u) => u.TipoPerfil == "Gestor";

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

    [HttpGet("categorias")]
    public IActionResult GetCategorias() => Ok(Categorias);

    // Membros: lista os tópicos publicados, com busca e filtro por categoria
    [HttpGet("topicos")]
    public async Task<IActionResult> GetTopicos([FromQuery] string? categoria, [FromQuery] string? busca)
    {
        var usuarioId = GetUsuarioId();
        if (usuarioId == 0) return Unauthorized();

        var query = _context.ForumTopicos.Where(t => t.Status == ForumStatus.Publicado);

        if (!string.IsNullOrWhiteSpace(categoria))
            query = query.Where(t => t.Categoria == categoria);

        if (!string.IsNullOrWhiteSpace(busca))
        {
            var termo = busca.Trim();
            query = query.Where(t => t.Titulo.Contains(termo) || t.Conteudo.Contains(termo));
        }

        var topicos = await query
            .OrderByDescending(t => t.DataModeracao ?? t.DataCriacao)
            .Select(t => new
            {
                t.Id,
                t.Titulo,
                t.Conteudo,
                t.Categoria,
                Data = t.DataModeracao ?? t.DataCriacao,
                Autor = new { t.Autor!.Nome, t.Autor.TipoPerfil, t.Autor.FotoPerfilUrl },
                TotalCurtidas = t.Curtidas.Count,
                TotalRespostas = t.Respostas.Count,
                CurtidoPorMim = t.Curtidas.Any(c => c.UsuarioId == usuarioId)
            })
            .ToListAsync();

        return Ok(topicos);
    }

    // Detalhe do tópico com as respostas. Tópico não publicado só é visível ao autor e ao gestor.
    [HttpGet("topicos/{id}")]
    public async Task<IActionResult> GetTopico(int id)
    {
        var usuario = await GetUsuarioLogado();
        if (usuario == null) return Unauthorized();

        var topico = await _context.ForumTopicos
            .Where(t => t.Id == id)
            .Select(t => new
            {
                t.Id,
                t.Titulo,
                t.Conteudo,
                t.Categoria,
                t.Status,
                t.MotivoRecusa,
                t.AutorId,
                Data = t.DataModeracao ?? t.DataCriacao,
                Autor = new { t.Autor!.Nome, t.Autor.TipoPerfil, t.Autor.FotoPerfilUrl },
                TotalCurtidas = t.Curtidas.Count,
                CurtidoPorMim = t.Curtidas.Any(c => c.UsuarioId == usuario.Id),
                Respostas = t.Respostas
                    .OrderBy(r => r.DataCriacao)
                    .Select(r => new
                    {
                        r.Id,
                        r.Conteudo,
                        r.AudioUrl,
                        r.DataCriacao,
                        r.AutorId,
                        Autor = new { r.Autor!.Nome, r.Autor.TipoPerfil, r.Autor.FotoPerfilUrl },
                        TotalCurtidas = r.Curtidas.Count,
                        CurtidoPorMim = r.Curtidas.Any(c => c.UsuarioId == usuario.Id),
                        Anexos = r.Anexos
                            .OrderBy(a => a.Id)
                            .Select(a => new { a.Id, a.NomeArquivo, a.Url, a.ContentType, a.TamanhoBytes })
                            .ToList()
                    })
                    .ToList()
            })
            .FirstOrDefaultAsync();

        if (topico == null) return NotFound(new { erro = "Tópico não encontrado." });

        if (topico.Status != ForumStatus.Publicado && topico.AutorId != usuario.Id && !EhGestor(usuario))
            return NotFound(new { erro = "Tópico não encontrado." });

        return Ok(new
        {
            topico.Id,
            topico.Titulo,
            topico.Conteudo,
            topico.Categoria,
            topico.Status,
            topico.MotivoRecusa,
            topico.Data,
            topico.Autor,
            topico.TotalCurtidas,
            topico.CurtidoPorMim,
            EhAutor = topico.AutorId == usuario.Id,
            UsuarioEhGestor = EhGestor(usuario),
            Respostas = topico.Respostas.Select(r => new
            {
                r.Id,
                r.Conteudo,
                r.AudioUrl,
                r.Anexos,
                r.DataCriacao,
                r.Autor,
                r.TotalCurtidas,
                r.CurtidoPorMim,
                PodeExcluir = r.AutorId == usuario.Id || EhGestor(usuario)
            })
        });
    }

    // Membro: abre um tópico novo. Vai para a fila do gestor como chamado (Pendente).
    [HttpPost("topicos")]
    public async Task<IActionResult> CriarTopico([FromBody] ForumTopicoDto dto)
    {
        var usuario = await GetUsuarioLogado();
        if (usuario == null) return Unauthorized();

        var titulo = dto.Titulo?.Trim() ?? "";
        var conteudo = dto.Conteudo?.Trim() ?? "";

        if (titulo.Length < 5 || titulo.Length > 150)
            return BadRequest(new { erro = "O título deve ter entre 5 e 150 caracteres." });
        if (conteudo.Length < 10)
            return BadRequest(new { erro = "Escreva pelo menos 10 caracteres no conteúdo." });
        if (!Categorias.Contains(dto.Categoria))
            return BadRequest(new { erro = "Categoria inválida." });

        // Tópico aberto pelo próprio gestor não precisa de aprovação
        var publicadoDireto = EhGestor(usuario);

        var topico = new ForumTopico
        {
            AutorId = usuario.Id,
            Titulo = titulo,
            Conteudo = conteudo,
            Categoria = dto.Categoria,
            Status = publicadoDireto ? ForumStatus.Publicado : ForumStatus.Pendente,
            DataCriacao = DateTime.UtcNow,
            DataModeracao = publicadoDireto ? DateTime.UtcNow : null
        };

        _context.ForumTopicos.Add(topico);
        await _context.SaveChangesAsync();

        if (!publicadoDireto)
        {
            var gestores = await _context.Usuarios
                .Where(u => u.TipoPerfil == "Gestor")
                .Select(u => u.Id)
                .ToListAsync();

            foreach (var gestorId in gestores)
                await Notificar(gestorId, "Novo chamado no Fórum", $"Tópico aguardando aprovação: {titulo}", "/gestor/forum");
        }

        return Ok(new
        {
            topico.Id,
            topico.Status,
            mensagem = publicadoDireto
                ? "Tópico publicado."
                : "Tópico enviado! Ele ficará visível para a comunidade após a aprovação do gestor."
        });
    }

    // Membro: acompanha os próprios tópicos e o status de cada um
    [HttpGet("meus-topicos")]
    public async Task<IActionResult> GetMeusTopicos()
    {
        var usuarioId = GetUsuarioId();
        if (usuarioId == 0) return Unauthorized();

        var topicos = await _context.ForumTopicos
            .Where(t => t.AutorId == usuarioId)
            .OrderByDescending(t => t.DataCriacao)
            .Select(t => new
            {
                t.Id,
                t.Titulo,
                t.Categoria,
                t.Status,
                t.MotivoRecusa,
                t.DataCriacao,
                TotalRespostas = t.Respostas.Count,
                TotalCurtidas = t.Curtidas.Count
            })
            .ToListAsync();

        return Ok(topicos);
    }

    // Gestor: fila de chamados, filtrada por status
    [HttpGet("chamados")]
    public async Task<IActionResult> GetChamados([FromQuery] string status = ForumStatus.Pendente)
    {
        var usuario = await GetUsuarioLogado();
        if (usuario == null) return Unauthorized();
        if (!EhGestor(usuario)) return Forbid();

        var query = _context.ForumTopicos.Where(t => t.Status == status);

        // Pendentes: o mais antigo primeiro (fila de atendimento). Demais: o mais recente primeiro.
        query = status == ForumStatus.Pendente
            ? query.OrderBy(t => t.DataCriacao)
            : query.OrderByDescending(t => t.DataModeracao ?? t.DataCriacao);

        var chamados = await query
            .Select(t => new
            {
                t.Id,
                t.Titulo,
                t.Conteudo,
                t.Categoria,
                t.Status,
                t.MotivoRecusa,
                t.DataCriacao,
                t.DataModeracao,
                Autor = new { t.Autor!.Nome, t.Autor.TipoPerfil, t.Autor.FotoPerfilUrl },
                TotalRespostas = t.Respostas.Count,
                TotalCurtidas = t.Curtidas.Count
            })
            .ToListAsync();

        var contagem = await _context.ForumTopicos
            .GroupBy(t => t.Status)
            .Select(g => new { Status = g.Key, Total = g.Count() })
            .ToDictionaryAsync(x => x.Status, x => x.Total);

        return Ok(new { chamados, contagem });
    }

    // Gestor: torna o tópico público
    [HttpPost("topicos/{id}/aprovar")]
    public async Task<IActionResult> Aprovar(int id)
    {
        var usuario = await GetUsuarioLogado();
        if (usuario == null) return Unauthorized();
        if (!EhGestor(usuario)) return Forbid();

        var topico = await _context.ForumTopicos.FindAsync(id);
        if (topico == null) return NotFound(new { erro = "Tópico não encontrado." });

        topico.Status = ForumStatus.Publicado;
        topico.MotivoRecusa = null;
        topico.DataModeracao = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        await Notificar(topico.AutorId, "Seu tópico foi publicado", topico.Titulo, $"/forum/topico/{topico.Id}");

        return Ok(new { mensagem = "Tópico publicado no fórum." });
    }

    // Gestor: recusa o tópico, informando o motivo ao autor
    [HttpPost("topicos/{id}/recusar")]
    public async Task<IActionResult> Recusar(int id, [FromBody] ForumRecusaDto dto)
    {
        var usuario = await GetUsuarioLogado();
        if (usuario == null) return Unauthorized();
        if (!EhGestor(usuario)) return Forbid();

        var motivo = dto.Motivo?.Trim() ?? "";
        if (motivo.Length < 5)
            return BadRequest(new { erro = "Informe o motivo da recusa (mínimo 5 caracteres)." });
        if (motivo.Length > 500)
            return BadRequest(new { erro = "O motivo deve ter no máximo 500 caracteres." });

        var topico = await _context.ForumTopicos.FindAsync(id);
        if (topico == null) return NotFound(new { erro = "Tópico não encontrado." });

        topico.Status = ForumStatus.Recusado;
        topico.MotivoRecusa = motivo;
        topico.DataModeracao = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        await Notificar(topico.AutorId, "Seu tópico não foi aprovado", $"{topico.Titulo} — Motivo: {motivo}", "/forum");

        return Ok(new { mensagem = "Tópico recusado." });
    }

    // Autor ou gestor: exclui o tópico (respostas e curtidas vão junto)
    [HttpDelete("topicos/{id}")]
    public async Task<IActionResult> ExcluirTopico(int id)
    {
        var usuario = await GetUsuarioLogado();
        if (usuario == null) return Unauthorized();

        var topico = await _context.ForumTopicos
            .Include(t => t.Respostas).ThenInclude(r => r.Anexos)
            .FirstOrDefaultAsync(t => t.Id == id);
        if (topico == null) return NotFound(new { erro = "Tópico não encontrado." });
        if (topico.AutorId != usuario.Id && !EhGestor(usuario)) return Forbid();

        await ExcluirArquivosDasRespostas(topico.Respostas);

        _context.ForumTopicos.Remove(topico);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // Membro ou gestor: responde a um tópico publicado.
    // Formulário multipart: "conteudo" (texto), "anexos" (até 3 arquivos) e "audio" (só o gestor).
    [HttpPost("topicos/{id}/respostas")]
    [RequestSizeLimit(30 * 1024 * 1024)]
    [RequestFormLimits(MultipartBodyLengthLimit = 30 * 1024 * 1024)]
    public async Task<IActionResult> Responder(int id, [FromForm] string? conteudo)
    {
        var usuario = await GetUsuarioLogado();
        if (usuario == null) return Unauthorized();

        var texto = conteudo?.Trim() ?? "";
        var anexos = Request.Form.Files.GetFiles("anexos").Where(f => f.Length > 0).ToList();
        var audio = Request.Form.Files.GetFile("audio");
        if (audio != null && audio.Length == 0) audio = null;

        if (texto.Length < 2 && anexos.Count == 0 && audio == null)
            return BadRequest(new { erro = "Escreva a sua resposta, anexe um arquivo ou envie um áudio." });

        if (audio != null)
        {
            if (!EhGestor(usuario))
                return BadRequest(new { erro = "Somente o gestor pode responder com áudio." });
            if (!ExtensoesAudio.Contains(Path.GetExtension(audio.FileName).ToLowerInvariant()))
                return BadRequest(new { erro = "Formato de áudio inválido. Envie .mp4, .m4a ou .mp3." });
            if (audio.Length > MaxBytesAudio)
                return BadRequest(new { erro = "O áudio deve ter no máximo 20 MB." });
        }

        if (anexos.Count > MaxAnexos)
            return BadRequest(new { erro = $"Envie no máximo {MaxAnexos} anexos por resposta." });

        foreach (var a in anexos)
        {
            if (!TiposAnexo.ContainsKey(Path.GetExtension(a.FileName).ToLowerInvariant()))
                return BadRequest(new { erro = $"Tipo de arquivo não permitido: {Path.GetFileName(a.FileName)}." });
            if (a.Length > MaxBytesAnexo)
                return BadRequest(new { erro = $"O arquivo {Path.GetFileName(a.FileName)} passa de 5 MB." });
        }

        if (anexos.Sum(a => a.Length) + (audio?.Length ?? 0) > MaxBytesTotal)
            return BadRequest(new { erro = "O total de arquivos da resposta passa de 28 MB." });

        var topico = await _context.ForumTopicos.FindAsync(id);
        if (topico == null) return NotFound(new { erro = "Tópico não encontrado." });
        if (topico.Status != ForumStatus.Publicado)
            return BadRequest(new { erro = "Só é possível responder a tópicos publicados." });

        var resposta = new ForumResposta
        {
            TopicoId = id,
            AutorId = usuario.Id,
            Conteudo = texto,
            DataCriacao = DateTime.UtcNow
        };

        try
        {
            if (audio != null)
                resposta.AudioUrl = await _blobService.UploadAudioAsync(audio, $"forum_{usuario.Id}", ContainerAudios);

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
            // Não deixa arquivo órfão no storage se algo falhar no meio do caminho
            await ExcluirArquivosDasRespostas(new[] { resposta });
            throw;
        }

        if (topico.AutorId != usuario.Id)
            await Notificar(topico.AutorId, "Nova resposta no seu tópico", topico.Titulo, $"/forum/topico/{topico.Id}");

        return Ok(new { resposta.Id });
    }

    // Autor da resposta ou gestor: exclui a resposta
    [HttpDelete("respostas/{id}")]
    public async Task<IActionResult> ExcluirResposta(int id)
    {
        var usuario = await GetUsuarioLogado();
        if (usuario == null) return Unauthorized();

        var resposta = await _context.ForumRespostas
            .Include(r => r.Anexos)
            .FirstOrDefaultAsync(r => r.Id == id);
        if (resposta == null) return NotFound(new { erro = "Resposta não encontrada." });
        if (resposta.AutorId != usuario.Id && !EhGestor(usuario)) return Forbid();

        await ExcluirArquivosDasRespostas(new[] { resposta });

        _context.ForumRespostas.Remove(resposta);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // Curtir / descurtir um tópico
    [HttpPost("topicos/{id}/curtir")]
    public async Task<IActionResult> CurtirTopico(int id)
    {
        var usuarioId = GetUsuarioId();
        if (usuarioId == 0) return Unauthorized();

        var publicado = await _context.ForumTopicos.AnyAsync(t => t.Id == id && t.Status == ForumStatus.Publicado);
        if (!publicado) return NotFound(new { erro = "Tópico não encontrado." });

        var curtida = await _context.ForumCurtidas.FirstOrDefaultAsync(c => c.TopicoId == id && c.UsuarioId == usuarioId);
        if (curtida == null)
            _context.ForumCurtidas.Add(new ForumCurtida { TopicoId = id, UsuarioId = usuarioId });
        else
            _context.ForumCurtidas.Remove(curtida);

        await _context.SaveChangesAsync();

        var total = await _context.ForumCurtidas.CountAsync(c => c.TopicoId == id);
        return Ok(new { curtido = curtida == null, total });
    }

    // Curtir / descurtir uma resposta
    [HttpPost("respostas/{id}/curtir")]
    public async Task<IActionResult> CurtirResposta(int id)
    {
        var usuarioId = GetUsuarioId();
        if (usuarioId == 0) return Unauthorized();

        var existe = await _context.ForumRespostas.AnyAsync(r => r.Id == id && r.Topico!.Status == ForumStatus.Publicado);
        if (!existe) return NotFound(new { erro = "Resposta não encontrada." });

        var curtida = await _context.ForumRespostaCurtidas.FirstOrDefaultAsync(c => c.RespostaId == id && c.UsuarioId == usuarioId);
        if (curtida == null)
            _context.ForumRespostaCurtidas.Add(new ForumRespostaCurtida { RespostaId = id, UsuarioId = usuarioId });
        else
            _context.ForumRespostaCurtidas.Remove(curtida);

        await _context.SaveChangesAsync();

        var total = await _context.ForumRespostaCurtidas.CountAsync(c => c.RespostaId == id);
        return Ok(new { curtido = curtida == null, total });
    }
}

public class ForumTopicoDto
{
    public string? Titulo { get; set; }
    public string? Conteudo { get; set; }
    public string Categoria { get; set; } = string.Empty;
}

public class ForumRecusaDto
{
    public string? Motivo { get; set; }
}
