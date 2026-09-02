using CaddieResearch.Api.Data;
using CaddieResearch.Api.Models;
using CaddieResearch.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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

    public MorningCallController(AppDbContext context, BlobService blobService)
    {
        _context = context;
        _blobService = blobService;
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
}

public class TopicoInputDto
{
    public string Titulo { get; set; } = string.Empty;
    public string Texto { get; set; } = string.Empty;
    public string? Link { get; set; }

    // Preenchido quando o gestor colou uma URL de imagem em vez de fazer upload
    public string? ImagemUrlExistente { get; set; }
}