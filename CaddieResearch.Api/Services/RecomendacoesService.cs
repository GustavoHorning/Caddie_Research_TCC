using Microsoft.EntityFrameworkCore;
using CaddieResearch.Api.Data;
using CaddieResearch.Api.Models;
using CaddieResearch.Api.DTOs.Recomendacoes;
using CaddieResearch.Api.DTOs.Portfolio;
using CaddieResearch.Api.Interfaces;

namespace CaddieResearch.Api.Services;

public class RecomendacoesService : IRecomendacoesService
{
    private readonly AppDbContext _context;

    public RecomendacoesService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<RecomendacaoResultDto>> ObterMinhasRecomendacoesAsync(int clienteId)
    {
        return await _context.Recomendacoes
            .Include(r => r.Gestor)
            .Where(r => r.ClienteId == clienteId)
            .OrderByDescending(r => r.DataCriacao)
            .Select(r => new RecomendacaoResultDto {
                Id = r.Id, Ticker = r.Ticker, NomeAtivo = r.NomeAtivo, ClasseAtivo = r.ClasseAtivo,
                Quantidade = r.Quantidade, PrecoSugerido = r.PrecoSugerido, Descricao = r.Descricao,
                Origem = r.Origem, Status = r.Status, DataCriacao = r.DataCriacao, DataResposta = r.DataResposta,
                PortfolioId = r.PortfolioId, NomeGestor = r.Gestor!.Nome
            }).ToListAsync();
    }

    public async Task<IEnumerable<RecomendacaoResultDto>> ObterRecomendacoesEnviadasAsync(int gestorId)
    {
        return await _context.Recomendacoes
            .Include(r => r.Cliente)
            .Where(r => r.GestorId == gestorId)
            .OrderByDescending(r => r.DataCriacao)
            .Select(r => new RecomendacaoResultDto {
                Id = r.Id, Ticker = r.Ticker, NomeAtivo = r.NomeAtivo, ClasseAtivo = r.ClasseAtivo,
                Quantidade = r.Quantidade, PrecoSugerido = r.PrecoSugerido, Descricao = r.Descricao,
                Origem = r.Origem, Status = r.Status, DataCriacao = r.DataCriacao, DataResposta = r.DataResposta,
                PortfolioId = r.PortfolioId, NomeCliente = r.Cliente!.Nome
            }).ToListAsync();
    }

    public async Task<RecomendacaoResultDto> CriarRecomendacaoAsync(int gestorId, RecomendacaoRequestDto dto)
    {
        var portfolio = await _context.Portfolios.FirstOrDefaultAsync(p => p.UsuarioId == dto.ClienteId);

        var recomendacao = new Recomendacao
        {
            GestorId = gestorId, ClienteId = dto.ClienteId, PortfolioId = portfolio?.Id,
            Ticker = dto.Ticker.ToUpper(), NomeAtivo = dto.NomeAtivo, ClasseAtivo = dto.ClasseAtivo,
            Quantidade = dto.Quantidade, PrecoSugerido = dto.PrecoSugerido, Descricao = dto.Descricao,
            Origem = dto.Origem ?? "Painel", Status = "Pendente", DataCriacao = DateTime.UtcNow
        };

        _context.Recomendacoes.Add(recomendacao);
        await _context.SaveChangesAsync();

        return new RecomendacaoResultDto { Id = recomendacao.Id, Ticker = recomendacao.Ticker, Status = recomendacao.Status };
    }

    public async Task<(bool Sucesso, string Mensagem, PosicaoResultDto? Posicao)> AderirRecomendacaoAsync(int recomendacaoId, int clienteId)
    {
        var rec = await _context.Recomendacoes.FirstOrDefaultAsync(r => r.Id == recomendacaoId && r.ClienteId == clienteId);
        if (rec == null) return (false, "Recomendação não encontrada.", null);
        if (rec.Status != "Pendente") return (false, "Recomendação já foi respondida.", null);

        var portfolio = await _context.Portfolios.FirstOrDefaultAsync(p => p.UsuarioId == clienteId);
        if (portfolio == null) return (false, "Nenhum portfólio encontrado.", null);

        var posicao = new Posicao
        {
            PortfolioId = portfolio.Id, Ticker = rec.Ticker, NomeAtivo = rec.NomeAtivo,
            ClasseAtivo = rec.ClasseAtivo, Quantidade = rec.Quantidade, PrecoMedio = rec.PrecoSugerido,
            DataEntrada = DateTime.UtcNow
        };

        _context.Posicoes.Add(posicao);
        rec.Status = "Aceita";
        rec.DataResposta = DateTime.UtcNow;
        rec.PortfolioId = portfolio.Id;

        await _context.SaveChangesAsync();

        var posicaoResult = new PosicaoResultDto
        {
            Id = posicao.Id, Ticker = posicao.Ticker, NomeAtivo = posicao.NomeAtivo,
            Quantidade = posicao.Quantidade, PrecoMedio = posicao.PrecoMedio,
            DataEntrada = posicao.DataEntrada, 
            ValorTotal = posicao.Quantidade * posicao.PrecoMedio // <-- A multiplicação foi restaurada aqui!
        };

        return (true, "Posição adicionada ao portfólio!", posicaoResult);
    }

    public async Task<(bool Sucesso, string Mensagem)> RecusarRecomendacaoAsync(int recomendacaoId, int clienteId)
    {
        var rec = await _context.Recomendacoes.FirstOrDefaultAsync(r => r.Id == recomendacaoId && r.ClienteId == clienteId);
        if (rec == null) return (false, "Recomendação não encontrada.");
        if (rec.Status != "Pendente") return (false, "Recomendação já foi respondida.");

        rec.Status = "Recusada";
        rec.DataResposta = DateTime.UtcNow;
        
        await _context.SaveChangesAsync();
        return (true, "Recomendação recusada.");
    }

    public async Task<IEnumerable<ClienteResultDto>> ObterClientesParaRecomendacaoAsync()
    {
        return await _context.Usuarios
            .Where(u => u.TipoPerfil == "Assinante")
            .Select(u => new ClienteResultDto { Id = u.Id, Nome = u.Nome, Email = u.Email })
            .ToListAsync();
    }
}