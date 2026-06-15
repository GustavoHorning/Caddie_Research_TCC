using CaddieResearch.Api.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace CaddieResearch.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class BuscasController : ControllerBase
{
    private readonly AppDbContext _context;

    public BuscasController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("global")]
    public async Task<IActionResult> BuscarGlobal([FromQuery] string termo)
    {
        if (string.IsNullOrWhiteSpace(termo)) 
            return BadRequest("O termo de busca não pode estar vazio.");

        termo = termo.ToLower();

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
                if (usuario.TipoPerfil == "Gestor") nivelAcessoUsuario = 999; 
                else
                {
                    var assinaturaAtiva = usuario.Assinaturas?.FirstOrDefault(a => a.Status == "Ativo");
                    string plano = (!string.IsNullOrEmpty(usuario.Plano) ? usuario.Plano : assinaturaAtiva?.PlanoNome ?? "").ToLower();

                    if (plano.Contains("black")) nivelAcessoUsuario = 3;
                    else if (plano.Contains("premium")) nivelAcessoUsuario = 2;
                    else if (plano.Contains("basic")) nivelAcessoUsuario = 1;
                }
            }
        }

        var relatorios = await _context.Relatorios
            .Include(r => r.Carteira)
            .Where(r => 
                r.Titulo.ToLower().Contains(termo) || 
                r.Assunto.ToLower().Contains(termo) ||
                (nivelAcessoUsuario >= (r.Carteira != null ? r.Carteira.NivelAcesso : 1) && 
                 (r.ConteudoTexto.ToLower().Contains(termo) || (r.ConteudoPdfTexto != null && r.ConteudoPdfTexto.ToLower().Contains(termo))))
            )
            .Select(r => new 
            {
                id = r.Id,
                realId = r.Id,
                tipo = "Relatório",
                titulo = r.Titulo,
                tags = new[] { r.Carteira != null ? r.Carteira.Nome : "Geral", r.Assunto },
                dataPublicacao = r.DataPublicacao,
                arquivoPdfUrl = r.ArquivoPdfUrl,
                url = "/relatorios",
                carteiraId = r.CarteiraId,
                nivelExigido = r.Carteira != null ? r.Carteira.NivelAcesso : 1
            })
            .ToListAsync();

        var ativos = await _context.Ativos
            .Include(a => a.Carteira)
            .Where(a => 
                a.Ticker.ToLower().Contains(termo) || 
                (a.NomeEmpresa != null && a.NomeEmpresa.ToLower().Contains(termo))
            )
            .Select(a => new 
            {
                id = "ativo_" + a.Id, 
                realId = a.Id,
                tipo = a.Carteira != null && a.Carteira.Nome.ToLower().Contains("fii") ? "FII" : 
                       a.Carteira != null && a.Carteira.Nome.ToLower().Contains("renda fixa") ? "Renda Fixa" : "Ação",
                titulo = $"{a.Ticker} - {a.NomeEmpresa ?? "Bolsa B3"}",
                tags = new[] { a.Carteira != null ? a.Carteira.Nome : "Geral", a.Categoria ?? "Aguardando" },
                dataPublicacao = a.DataInclusao,
                url = "/carteiras",
                carteiraId = a.CarteiraId,
                nivelExigido = a.Carteira != null ? a.Carteira.NivelAcesso : 1
            })
            .ToListAsync();

        var resultadosMisturados = relatorios.Cast<object>().Concat(ativos.Cast<object>()).ToList();

        return Ok(resultadosMisturados);
    }
}