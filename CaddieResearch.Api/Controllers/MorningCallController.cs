using CaddieResearch.Api.Data;
using CaddieResearch.Api.Hubs;
using CaddieResearch.Api.Models;
using CaddieResearch.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;

namespace CaddieResearch.Api.Controllers;

[Route("api/morningcall")]
[ApiController]
[Authorize]
public class MorningCallController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly BlobService _blobService;
    private readonly IHubContext<NotificationHub> _hubContext;

    public MorningCallController(AppDbContext context, BlobService blobService, IHubContext<NotificationHub> hubContext)
    {
        _context = context;
        _blobService = blobService;
        _hubContext = hubContext;
    }

    private int GetUsuarioId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(claim, out int id) ? id : 0;
    }

    // Cliente e gestor: lista todos os Morning Calls publicados (mais recente primeiro).
    // Sem filtro por gestor por enquanto — qualquer cliente logado vê todos.
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var morningCalls = await _context.MorningCalls
            .Include(m => m.Gestor)
            .Include(m => m.Topicos)
            .OrderByDescending(m => m.Data)
            .ThenByDescending(m => m.DataCriacao)
            .Select(m => new
            {
                m.Id,
                m.Titulo,
                m.Data,
                m.DataCriacao,
                NomeGestor = m.Gestor!.Nome,
                Topicos = m.Topicos
                    .OrderBy(t => t.Ordem)
                    .Select(t => new
                    {
                        t.Id,
                        t.Titulo,
                        t.Texto,
                        t.Link,
                        t.ImagemUrl
                    })
            })
            .ToListAsync();

        return Ok(morningCalls);
    }

    // Gestor: lista só os Morning Calls que ele mesmo criou
    [HttpGet("meus")]
    public async Task<IActionResult> GetMeus()
    {
        var gestorId = GetUsuarioId();
        if (gestorId == 0) return Unauthorized();

        var morningCalls = await _context.MorningCalls
            .Include(m => m.Topicos)
            .Where(m => m.GestorId == gestorId)
            .OrderByDescending(m => m.Data)
            .ThenByDescending(m => m.DataCriacao)
            .Select(m => new
            {
                m.Id,
                m.Titulo,
                m.Data,
                m.DataCriacao,
                Topicos = m.Topicos
                    .OrderBy(t => t.Ordem)
                    .Select(t => new
                    {
                        t.Id,
                        t.Titulo,
                        t.Texto,
                        t.Link,
                        t.ImagemUrl
                    })
            })
            .ToListAsync();

        return Ok(morningCalls);
    }

    // Gestor: cria um Morning Call novo.
    // "topicosJson" é uma lista de tópicos serializada em JSON (titulo, texto, link).
    // Cada imagem enviada vem no campo "imagem_0", "imagem_1", etc. — o número é o
    // índice do tópico correspondente em topicosJson. Um tópico sem imagem de upload
    // simplesmente não tem um campo "imagem_N" no formulário.
    [HttpPost]
    public async Task<IActionResult> Post([FromForm] string titulo, [FromForm] string data, [FromForm] string topicosJson)
    {
        var gestorId = GetUsuarioId();
        if (gestorId == 0) return Unauthorized();

        if (string.IsNullOrWhiteSpace(titulo))
            return BadRequest(new { erro = "O título é obrigatório." });

        if (!DateTime.TryParse(data, out var dataConvertida))
            return BadRequest(new { erro = "Data inválida." });

        List<TopicoInputDto>? topicosInput;
        try
        {
            topicosInput = JsonSerializer.Deserialize<List<TopicoInputDto>>(topicosJson, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });
        }
        catch
        {
            return BadRequest(new { erro = "Formato inválido para os tópicos." });
        }

        if (topicosInput == null || topicosInput.Count == 0)
            return BadRequest(new { erro = "É necessário pelo menos um tópico." });

        var morningCall = new MorningCall
        {
            GestorId = gestorId,
            Titulo = titulo,
            Data = dataConvertida,
            DataCriacao = DateTime.UtcNow
        };

        for (int i = 0; i < topicosInput.Count; i++)
        {
            var topicoInput = topicosInput[i];
            string? imagemUrl = topicoInput.ImagemUrlExistente;

            // Busca a imagem desse tópico pelo nome do campo (imagem_0, imagem_1, ...)
            var arquivo = Request.Form.Files.GetFile($"imagem_{i}");
            if (arquivo != null && arquivo.Length > 0)
            {
                imagemUrl = await _blobService.UploadImagemAsync(arquivo, $"morningcall_{gestorId}");
            }

            morningCall.Topicos.Add(new MorningCallTopico
            {
                Titulo = topicoInput.Titulo,
                Texto = topicoInput.Texto,
                Link = topicoInput.Link,
                ImagemUrl = imagemUrl,
                Ordem = i
            });
        }

        _context.MorningCalls.Add(morningCall);
        await _context.SaveChangesAsync();

        // Notifica todos os clientes que um novo Morning Call foi publicado
        var notificacao = new Notificacao
        {
            UsuarioId = null, // geral — todos os clientes recebem
            Titulo = "Novo Morning Call disponível",
            Mensagem = titulo,
            Tipo = "Info",
            LinkDestino = "/morning-call",
            DataCriacao = DateTime.UtcNow
        };
        _context.Notificacoes.Add(notificacao);
        await _context.SaveChangesAsync();
        await _hubContext.Clients.All.SendAsync("ReceberNotificacao", notificacao);

        return Ok(new { mensagem = "Morning Call publicado com sucesso!", id = morningCall.Id });
    }

    // Gestor: exclui um Morning Call que ele mesmo criou
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var gestorId = GetUsuarioId();
        if (gestorId == 0) return Unauthorized();

        var morningCall = await _context.MorningCalls
            .Include(m => m.Topicos)
            .FirstOrDefaultAsync(m => m.Id == id && m.GestorId == gestorId);

        if (morningCall == null) return NotFound();

        foreach (var topico in morningCall.Topicos)
        {
            if (!string.IsNullOrEmpty(topico.ImagemUrl))
                await _blobService.ExcluirImagemAsync(topico.ImagemUrl);
        }

        _context.MorningCalls.Remove(morningCall);
        await _context.SaveChangesAsync();

        return Ok(new { mensagem = "Morning Call excluído." });
    }

    // Gestor: exclui um tópico (notícia) específico de um Morning Call que ele mesmo criou,
    // sem apagar o restante do Morning Call
    [HttpDelete("{morningCallId}/topicos/{topicoId}")]
    public async Task<IActionResult> DeleteTopico(int morningCallId, int topicoId)
    {
        var gestorId = GetUsuarioId();
        if (gestorId == 0) return Unauthorized();

        var morningCall = await _context.MorningCalls
            .Include(m => m.Topicos)
            .FirstOrDefaultAsync(m => m.Id == morningCallId && m.GestorId == gestorId);

        if (morningCall == null) return NotFound(new { erro = "Morning Call não encontrado." });

        var topico = morningCall.Topicos.FirstOrDefault(t => t.Id == topicoId);
        if (topico == null) return NotFound(new { erro = "Tópico não encontrado." });

        if (!string.IsNullOrEmpty(topico.ImagemUrl))
            await _blobService.ExcluirImagemAsync(topico.ImagemUrl);

        _context.MorningCallTopicos.Remove(topico);
        await _context.SaveChangesAsync();

        return Ok(new { mensagem = "Notícia removida." });
    }

    // Gestor: edita um Morning Call que ele mesmo criou (título, data e tópicos).
    // Segue o mesmo formato de entrada do Post. Tópicos com "id" preenchido são
    // atualizados; tópicos sem "id" são criados; tópicos que existiam mas não vieram
    // nesta lista são removidos (junto com a imagem deles no Blob, se houver).
    [HttpPut("{id}")]
    public async Task<IActionResult> Put(int id, [FromForm] string titulo, [FromForm] string data, [FromForm] string topicosJson)
    {
        var gestorId = GetUsuarioId();
        if (gestorId == 0) return Unauthorized();

        var morningCall = await _context.MorningCalls
            .Include(m => m.Topicos)
            .FirstOrDefaultAsync(m => m.Id == id && m.GestorId == gestorId);

        if (morningCall == null) return NotFound(new { erro = "Morning Call não encontrado." });

        if (string.IsNullOrWhiteSpace(titulo))
            return BadRequest(new { erro = "O título é obrigatório." });

        if (!DateTime.TryParse(data, out var dataConvertida))
            return BadRequest(new { erro = "Data inválida." });

        List<TopicoInputDto>? topicosInput;
        try
        {
            topicosInput = JsonSerializer.Deserialize<List<TopicoInputDto>>(topicosJson, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });
        }
        catch
        {
            return BadRequest(new { erro = "Formato inválido para os tópicos." });
        }

        if (topicosInput == null || topicosInput.Count == 0)
            return BadRequest(new { erro = "É necessário pelo menos um tópico." });

        morningCall.Titulo = titulo;
        morningCall.Data = dataConvertida;

        // Remove tópicos que existiam antes mas não vieram mais na lista enviada
        var idsEnviados = topicosInput.Where(t => t.Id.HasValue).Select(t => t.Id!.Value).ToHashSet();
        var topicosParaRemover = morningCall.Topicos.Where(t => !idsEnviados.Contains(t.Id)).ToList();
        foreach (var topicoRemovido in topicosParaRemover)
        {
            if (!string.IsNullOrEmpty(topicoRemovido.ImagemUrl))
                await _blobService.ExcluirImagemAsync(topicoRemovido.ImagemUrl);
            _context.MorningCallTopicos.Remove(topicoRemovido);
        }

        for (int i = 0; i < topicosInput.Count; i++)
        {
            var topicoInput = topicosInput[i];
            string? imagemUrl = topicoInput.ImagemUrlExistente;

            // Nova imagem enviada nessa posição? Faz upload e substitui a anterior
            var arquivo = Request.Form.Files.GetFile($"imagem_{i}");
            if (arquivo != null && arquivo.Length > 0)
            {
                imagemUrl = await _blobService.UploadImagemAsync(arquivo, $"morningcall_{gestorId}");
            }

            if (topicoInput.Id.HasValue)
            {
                // Tópico existente: atualiza os campos
                var topicoExistente = morningCall.Topicos.FirstOrDefault(t => t.Id == topicoInput.Id.Value);
                if (topicoExistente != null)
                {
                    topicoExistente.Titulo = topicoInput.Titulo;
                    topicoExistente.Texto = topicoInput.Texto;
                    topicoExistente.Link = topicoInput.Link;
                    topicoExistente.Ordem = i;

                    // Só troca a imagem se veio uma nova (upload) ou uma URL diferente;
                    // se o campo ficou vazio, mantém a imagem que já estava salva
                    if (arquivo != null && arquivo.Length > 0)
                    {
                        if (!string.IsNullOrEmpty(topicoExistente.ImagemUrl))
                            await _blobService.ExcluirImagemAsync(topicoExistente.ImagemUrl);
                        topicoExistente.ImagemUrl = imagemUrl;
                    }
                    else if (!string.IsNullOrEmpty(topicoInput.ImagemUrlExistente))
                    {
                        topicoExistente.ImagemUrl = topicoInput.ImagemUrlExistente;
                    }
                }
            }
            else
            {
                // Tópico novo, adicionado durante a edição
                morningCall.Topicos.Add(new MorningCallTopico
                {
                    Titulo = topicoInput.Titulo,
                    Texto = topicoInput.Texto,
                    Link = topicoInput.Link,
                    ImagemUrl = imagemUrl,
                    Ordem = i
                });
            }
        }

        await _context.SaveChangesAsync();

        return Ok(new { mensagem = "Morning Call atualizado com sucesso!" });
    }
}

public class TopicoInputDto
{
    // Preenchido só quando esse tópico já existia (edição). Nulo = tópico novo.
    public int? Id { get; set; }

    public string Titulo { get; set; } = string.Empty;
    public string Texto { get; set; } = string.Empty;
    public string? Link { get; set; }

    // Preenchido quando o gestor colou uma URL de imagem em vez de fazer upload
    public string? ImagemUrlExistente { get; set; }
}