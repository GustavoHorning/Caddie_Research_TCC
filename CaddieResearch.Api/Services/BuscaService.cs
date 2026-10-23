using Microsoft.EntityFrameworkCore;
using CaddieResearch.Api.Data;
using CaddieResearch.Api.DTOs.Busca;
using CaddieResearch.Api.Interfaces;

namespace CaddieResearch.Api.Services;

public class BuscaService : IBuscaService
{
    private readonly AppDbContext _context;

    public BuscaService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<BuscaGlobalResultDto>> BuscarGlobalAsync(string termo, int usuarioId)
    {
        termo = termo.ToLower();
        int nivelAcessoUsuario = 0; 
        
        if (usuarioId > 0)
        {
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
                (r.TagsAtivos != null && r.TagsAtivos.ToLower().Contains(termo)) || 
                (nivelAcessoUsuario >= (r.Carteira != null ? r.Carteira.NivelAcesso : 1) && 
                 (r.ConteudoTexto.ToLower().Contains(termo) || (r.ConteudoPdfTexto != null && r.ConteudoPdfTexto.ToLower().Contains(termo))))
            )
            .Select(r => new BuscaGlobalResultDto
            {
                Id = r.Id.ToString(),
                RealId = r.Id,
                Tipo = "Relatório",
                Titulo = r.Titulo,
                Tags = new[] { r.Carteira != null ? r.Carteira.Nome : "Geral", r.Assunto },
                DataPublicacao = r.DataPublicacao,
                ArquivoPdfUrl = r.ArquivoPdfUrl,
                Url = "/relatorios",
                CarteiraId = r.CarteiraId,
                NivelExigido = r.Carteira != null ? r.Carteira.NivelAcesso : 1
            })
            .ToListAsync();

        var ativos = await _context.Ativos
            .Include(a => a.Carteira)
            .Where(a => 
                a.Ticker.ToLower().Contains(termo) || 
                (a.NomeEmpresa != null && a.NomeEmpresa.ToLower().Contains(termo))
            )
            .Select(a => new BuscaGlobalResultDto
            {
                Id = "ativo_" + a.Id, 
                RealId = a.Id,
                Tipo = a.Carteira != null && a.Carteira.Nome.ToLower().Contains("fii") ? "FII" : 
                       a.Carteira != null && a.Carteira.Nome.ToLower().Contains("renda fixa") ? "Renda Fixa" : "Ação",
                Titulo = $"{a.Ticker} - {a.NomeEmpresa ?? "Bolsa B3"}",
                Tags = new[] { a.Carteira != null ? a.Carteira.Nome : "Geral", a.Categoria ?? "Aguardando" },
                DataPublicacao = a.DataEntrada,
                Url = "/carteiras",
                CarteiraId = a.CarteiraId,
                NivelExigido = a.Carteira != null ? a.Carteira.NivelAcesso : 1
            })
            .ToListAsync();

        var auditoriasBrutas = await _context.HistoricoRecomendacoesCarteiras
            .Include(h => h.Carteira)
            .Where(h => h.Ticker.ToLower().Contains(termo) || h.NomeAtivo.ToLower().Contains(termo))
            .ToListAsync(); 

        var auditorias = auditoriasBrutas
            .GroupBy(h => h.Ticker)
            .Select(g => g.OrderByDescending(h => h.DataRecomendacao).First()) 
            .Select(h => new BuscaGlobalResultDto
            {
                Id = "auditoria_" + h.Id,
                RealId = h.Id,
                Tipo = "Auditoria",
                Titulo = $"Auditoria de Ativo: {h.Ticker}",
                Tags = new[] { "Auditoria", h.Carteira != null ? h.Carteira.Nome : "Log" },
                DataPublicacao = h.DataRecomendacao,
                ArquivoPdfUrl = null,
                Url = "/auditoria",
                CarteiraId = h.CarteiraId,
                NivelExigido = h.Carteira != null ? h.Carteira.NivelAcesso : 1
            })
            .ToList();

        var resultadosMisturados = new List<BuscaGlobalResultDto>();
        resultadosMisturados.AddRange(relatorios);
        resultadosMisturados.AddRange(ativos);
        resultadosMisturados.AddRange(auditorias);

        return resultadosMisturados;
    }
}