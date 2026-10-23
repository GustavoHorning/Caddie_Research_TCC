using Microsoft.EntityFrameworkCore;
using CaddieResearch.Api.Data;
using CaddieResearch.Api.DTOs.Historico;
using CaddieResearch.Api.Interfaces;

namespace CaddieResearch.Api.Services;

public class HistoricoService : IHistoricoService
{
    private readonly AppDbContext _context;

    public HistoricoService(AppDbContext context)
    {
        _context = context;
    }

    private string ObterNomePlanoMinimo(int nivelExigido)
    {
        return nivelExigido switch { 3 => "Black", 2 => "Premium", _ => "Basic" };
    }

    public async Task<List<HistoricoAtivoAgrupadoDto>> ObterHistoricoCentradoNoAtivoAsync(int carteiraId, int usuarioId, int nivelAcesso, bool ehGestor)
    {
        var historico = await _context.HistoricoRecomendacoesCarteiras
            .Include(h => h.Gestor)
            .Where(h => h.CarteiraId == carteiraId)
            .OrderByDescending(h => h.DataRecomendacao)
            .ToListAsync();

        var relatorios = await _context.Relatorios
            .Include(r => r.Carteira)
            .OrderByDescending(r => r.DataPublicacao)
            .ToListAsync();

        var resultado = historico.GroupBy(h => h.Ticker).Select(g => new HistoricoAtivoAgrupadoDto {
            Ticker = g.Key,
            NomeAtivo = g.First().NomeAtivo,
            Bloqueado = false, // Se chegou aqui, passou na validação da carteira
            NivelExigido = 0,
            Logs = g.Select(h => new LogHistoricoDto {
                Id = h.Id, Acao = h.Acao, Vies = h.Vies, PrecoAlvo = h.PrecoAlvo, 
                Justificativa = h.Justificativa, DataRecomendacao = h.DataRecomendacao, 
                NomeGestor = h.Gestor!.Nome
            }).ToList(),
            RelatoriosRelacionados = relatorios
                .Where(r => (r.TagsAtivos != null && r.TagsAtivos.ToUpper().Contains(g.Key.ToUpper())) || r.Titulo.ToUpper().Contains(g.Key.ToUpper()))
                .Select(r => {
                    int nivelExigido = r.Carteira?.NivelAcesso ?? 1;
                    return new RelatorioRelacionadoDto {
                        Id = r.Id, Titulo = r.Titulo, Assunto = r.Assunto, DataPublicacao = r.DataPublicacao,
                        NomeCarteira = r.Carteira?.Nome ?? "Geral",
                        Bloqueado = !ehGestor && nivelAcesso < nivelExigido,
                        PlanoMinimo = ObterNomePlanoMinimo(nivelExigido)
                    };
                }).ToList()
        }).ToList();

        return resultado;
    }

    public async Task<List<HistoricoAtivoAgrupadoDto>> ObterHistoricoGlobalAsync(int usuarioId, int nivelAcesso, bool ehGestor)
    {
        var historico = await _context.HistoricoRecomendacoesCarteiras
            .Include(h => h.Gestor)
            .Include(h => h.Carteira)
            .OrderByDescending(h => h.DataRecomendacao)
            .ToListAsync();

        var relatorios = await _context.Relatorios
            .Include(r => r.Carteira)
            .OrderByDescending(r => r.DataPublicacao)
            .ToListAsync();

        var tickersNosLogs = historico.Select(h => h.Ticker.ToUpper().Trim());
        var tickersNosRelatorios = relatorios
            .Where(r => !string.IsNullOrWhiteSpace(r.TagsAtivos))
            .SelectMany(r => r.TagsAtivos.Split(',', StringSplitOptions.RemoveEmptyEntries))
            .Select(t => t.ToUpper().Trim());

        var todosTickers = tickersNosLogs.Concat(tickersNosRelatorios).Distinct().ToList();

        return todosTickers.Select(ticker => {
            var logsDoTicker = historico.Where(h => h.Ticker.ToUpper().Trim() == ticker).ToList();
            var primeiroLog = logsDoTicker.FirstOrDefault();
            int nivelExigidoAtivo = primeiroLog?.Carteira?.NivelAcesso ?? 1;
            bool bloqueado = primeiroLog != null && !ehGestor && nivelAcesso < nivelExigidoAtivo;

            return new HistoricoAtivoAgrupadoDto {
                Ticker = ticker,
                NomeAtivo = primeiroLog?.NomeAtivo ?? "Ativo Monitorado pela Research",
                Bloqueado = bloqueado,
                NivelExigido = nivelExigidoAtivo,
                PlanoMinimo = ObterNomePlanoMinimo(nivelExigidoAtivo),
                Logs = logsDoTicker.Select(h => {
                    int nivelCarteiraLog = h.Carteira?.NivelAcesso ?? 1;
                    bool logBloqueado = !ehGestor && nivelAcesso < nivelCarteiraLog;
                    return new LogHistoricoDto {
                        Id = h.Id,
                        Acao = h.Acao,
                        Vies = logBloqueado ? "Restrito" : h.Vies,
                        PrecoAlvo = logBloqueado ? 0m : h.PrecoAlvo,
                        Justificativa = logBloqueado ? $"Conteúdo exclusivo para assinantes do plano {ObterNomePlanoMinimo(nivelCarteiraLog)}." : h.Justificativa,
                        DataRecomendacao = h.DataRecomendacao,
                        NomeGestor = h.Gestor?.Nome ?? "Gestor Caddie",
                        NomeCarteira = h.Carteira?.Nome ?? "Carteira",
                        Bloqueado = logBloqueado,
                        PlanoMinimo = ObterNomePlanoMinimo(nivelCarteiraLog)
                    };
                }).ToList(),
                RelatoriosRelacionados = relatorios
                    .Where(r => (r.TagsAtivos != null && r.TagsAtivos.ToUpper().Split(',').Select(x => x.Trim()).Contains(ticker)) 
                             || r.Titulo.ToUpper().Contains(ticker))
                    .Select(r => {
                        int rNivelExigido = r.Carteira?.NivelAcesso ?? 1;
                        return new RelatorioRelacionadoDto {
                            Id = r.Id, Titulo = r.Titulo, Assunto = r.Assunto, DataPublicacao = r.DataPublicacao,
                            NomeCarteira = r.Carteira?.Nome ?? "Geral",
                            Bloqueado = !ehGestor && nivelAcesso < rNivelExigido,
                            PlanoMinimo = ObterNomePlanoMinimo(rNivelExigido)
                        };
                    }).ToList()
            };
        }).ToList();
    }
}