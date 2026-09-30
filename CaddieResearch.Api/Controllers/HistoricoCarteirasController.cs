using CaddieResearch.Api.Data;
using CaddieResearch.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Linq;
using System.Threading.Tasks;
using System;
using System.Collections.Generic;

namespace CaddieResearch.Api.Controllers;

[Route("api/historico-carteiras")]
[ApiController]
[Authorize]
public class HistoricoCarteirasController : ControllerBase
{
    private readonly AppDbContext _context;

    public HistoricoCarteirasController(AppDbContext context)
    {
        _context = context;
    }

    private int ObterNivelAcesso(Usuario usuario)
    {
        if (usuario.TipoPerfil == "Gestor") return 999;
        
        var assinaturaAtiva = usuario.Assinaturas?.FirstOrDefault(a => a.Status == "Ativo");
        string plano = !string.IsNullOrEmpty(usuario.Plano) ? usuario.Plano.ToLower() : 
                       (assinaturaAtiva != null ? assinaturaAtiva.PlanoNome.ToLower() : "");

        if (plano.Contains("black")) return 3;
        if (plano.Contains("premium")) return 2;
        if (plano.Contains("basic")) return 1;
        return 0;
    }

    private string ObterNomePlanoMinimo(int nivelExigido)
    {
        return nivelExigido switch
        {
            3 => "Black",
            2 => "Premium",
            _ => "Basic"
        };
    }

    private int GetUsuarioId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(claim, out int id) ? id : 0;
    }

    // GET: Lista o histórico de uma carteira específica centrado no ativo
    [HttpGet("{carteiraId}")]
    public async Task<IActionResult> GetHistoricoCentradoNoAtivo(int carteiraId)
    {
        var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(idClaim, out int usuarioId)) return Unauthorized();

        var usuario = await _context.Usuarios.Include(u => u.Assinaturas).FirstOrDefaultAsync(u => u.Id == usuarioId);
        if (usuario == null) return Unauthorized();

        var carteira = await _context.Carteiras.FindAsync(carteiraId);
        if (carteira == null) return NotFound();

        int nivelAcesso = ObterNivelAcesso(usuario);
        if (nivelAcesso < carteira.NivelAcesso && usuario.TipoPerfil != "Gestor") 
            return StatusCode(403, new { mensagem = "Seu plano não permite visualizar o histórico desta carteira." });

        var historico = await _context.HistoricoRecomendacoesCarteiras
            .Include(h => h.Gestor)
            .Where(h => h.CarteiraId == carteiraId)
            .OrderByDescending(h => h.DataRecomendacao)
            .ToListAsync();

        var relatorios = await _context.Relatorios
            .Include(r => r.Carteira)
            .OrderByDescending(r => r.DataPublicacao)
            .Select(r => new { 
                r.Id, 
                r.Titulo, 
                r.Assunto, 
                r.DataPublicacao, 
                r.TagsAtivos, 
                r.CarteiraId,
                NomeCarteira = r.Carteira != null ? r.Carteira.Nome : "Geral",
                NivelExigido = r.Carteira != null ? r.Carteira.NivelAcesso : 1
            })
            .ToListAsync();

        var resultado = historico.GroupBy(h => h.Ticker).Select(g => new {
            Ticker = g.Key,
            NomeAtivo = g.First().NomeAtivo,
            Logs = g.Select(h => new {
                h.Id, h.Acao, h.Vies, h.PrecoAlvo, h.Justificativa, 
                h.DataRecomendacao, NomeGestor = h.Gestor!.Nome
            }).ToList(),
            RelatoriosRelacionados = relatorios
                .Where(r => (r.TagsAtivos != null && r.TagsAtivos.ToUpper().Contains(g.Key.ToUpper())) || r.Titulo.ToUpper().Contains(g.Key.ToUpper()))
                .Select(r => new {
                    r.Id,
                    r.Titulo,
                    r.Assunto,
                    r.DataPublicacao,
                    r.NomeCarteira,
                    Bloqueado = usuario.TipoPerfil != "Gestor" && nivelAcesso < r.NivelExigido,
                    PlanoMinimo = ObterNomePlanoMinimo(r.NivelExigido)
                })
                .ToList()
        }).ToList();

        return Ok(resultado);
    }

    // GET: Lista o histórico global (recomendações + histórico de relatórios por ativo)
    [HttpGet]
    public async Task<IActionResult> GetHistoricoGlobal()
    {
        var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(idClaim, out int usuarioId)) return Unauthorized();

        var usuario = await _context.Usuarios.Include(u => u.Assinaturas).FirstOrDefaultAsync(u => u.Id == usuarioId);
        if (usuario == null) return Unauthorized();

        int nivelAcesso = ObterNivelAcesso(usuario);

        var historico = await _context.HistoricoRecomendacoesCarteiras
            .Include(h => h.Gestor)
            .Include(h => h.Carteira)
            .OrderByDescending(h => h.DataRecomendacao)
            .ToListAsync();

        var relatorios = await _context.Relatorios
            .Include(r => r.Carteira)
            .OrderByDescending(r => r.DataPublicacao)
            .Select(r => new { 
                r.Id, 
                r.Titulo, 
                r.Assunto, 
                r.DataPublicacao, 
                r.TagsAtivos, 
                r.CarteiraId, 
                NomeCarteira = r.Carteira != null ? r.Carteira.Nome : "Geral",
                NivelExigido = r.Carteira != null ? r.Carteira.NivelAcesso : 1 
            })
            .ToListAsync();

        // Coleta todos os Tickers que têm log de carteira OU foram vinculados em relatórios
        var tickersNosLogs = historico.Select(h => h.Ticker.ToUpper().Trim());
        var tickersNosRelatorios = relatorios
            .Where(r => !string.IsNullOrWhiteSpace(r.TagsAtivos))
            .SelectMany(r => r.TagsAtivos.Split(',', StringSplitOptions.RemoveEmptyEntries))
            .Select(t => t.ToUpper().Trim());

        var todosTickers = tickersNosLogs.Concat(tickersNosRelatorios).Distinct().ToList();

        var resultado = todosTickers.Select(ticker => {
            var logsDoTicker = historico.Where(h => h.Ticker.ToUpper().Trim() == ticker).ToList();
            var relatoriosDoTicker = relatorios
                .Where(r => (r.TagsAtivos != null && r.TagsAtivos.ToUpper().Split(',').Select(x => x.Trim()).Contains(ticker)) 
                         || r.Titulo.ToUpper().Contains(ticker))
                .Select(r => new {
                    r.Id,
                    r.Titulo,
                    r.Assunto,
                    r.DataPublicacao,
                    r.NomeCarteira,
                    Bloqueado = usuario.TipoPerfil != "Gestor" && nivelAcesso < r.NivelExigido,
                    PlanoMinimo = ObterNomePlanoMinimo(r.NivelExigido)
                })
                .ToList();

            var primeiroLog = logsDoTicker.FirstOrDefault();
            int nivelExigidoAtivo = primeiroLog?.Carteira?.NivelAcesso ?? 1;
            bool bloqueado = primeiroLog != null && usuario.TipoPerfil != "Gestor" && nivelAcesso < nivelExigidoAtivo;
            string planoMinimo = ObterNomePlanoMinimo(nivelExigidoAtivo);

            return new {
                Ticker = ticker,
                NomeAtivo = primeiroLog?.NomeAtivo ?? "Ativo Monitorado pela Research",
                Bloqueado = bloqueado,
                NivelExigido = nivelExigidoAtivo,
                PlanoMinimo = planoMinimo,
                Logs = logsDoTicker.Select(h => {
                    int nivelCarteiraLog = h.Carteira?.NivelAcesso ?? 1;
                    bool logBloqueado = usuario.TipoPerfil != "Gestor" && nivelAcesso < nivelCarteiraLog;
                    return new {
                        h.Id,
                        h.Acao,
                        Vies = logBloqueado ? "Restrito" : h.Vies,
                        PrecoAlvo = logBloqueado ? 0m : h.PrecoAlvo,
                        Justificativa = logBloqueado ? $"Conteúdo exclusivo para assinantes do plano {ObterNomePlanoMinimo(nivelCarteiraLog)}." : h.Justificativa,
                        h.DataRecomendacao,
                        NomeGestor = h.Gestor != null ? h.Gestor.Nome : "Gestor Caddie",
                        NomeCarteira = h.Carteira != null ? h.Carteira.Nome : "Carteira",
                        Bloqueado = logBloqueado,
                        PlanoMinimo = ObterNomePlanoMinimo(nivelCarteiraLog)
                    };
                }).ToList(),
                RelatoriosRelacionados = relatoriosDoTicker
            };
        }).ToList();

        return Ok(resultado);
    }

    [HttpPost]
    [Authorize(Roles = "Gestor")]
    public async Task<IActionResult> CriarRegistro([FromBody] HistoricoRecomendacaoCarteira dto)
    {
        var gestorId = GetUsuarioId();
        if (gestorId == 0) return Unauthorized();

        var novoRegistro = new HistoricoRecomendacaoCarteira
        {
            CarteiraId = dto.CarteiraId,
            GestorId = gestorId,
            Ticker = dto.Ticker.ToUpper(),
            NomeAtivo = dto.NomeAtivo,
            Acao = dto.Acao,
            Vies = dto.Vies,
            PrecoAlvo = dto.PrecoAlvo,
            Justificativa = dto.Justificativa,
            DataRecomendacao = DateTime.UtcNow
        };

        _context.HistoricoRecomendacoesCarteiras.Add(novoRegistro);
        await _context.SaveChangesAsync();
        
        return Ok(novoRegistro);
    }
}