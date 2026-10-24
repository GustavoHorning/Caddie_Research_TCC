using CaddieResearch.Api.Data;
using CaddieResearch.Api.Models;
using CaddieResearch.Api.DTOs.Ativos;
using CaddieResearch.Api.Interfaces;
using CaddieResearch.Models;
using Microsoft.EntityFrameworkCore;

namespace CaddieResearch.Api.Services;

public class AtivosService : IAtivosService
{
    private readonly AppDbContext _context;
    private readonly IAcoesService _acoesService;
    private readonly INotificacaoService _notificacaoService;

    public AtivosService(AppDbContext context, IAcoesService acoesService, INotificacaoService notificacaoService)
    {
        _context = context;
        _acoesService = acoesService;
        _notificacaoService = notificacaoService;
    }

    public async Task<(bool Sucesso, string Mensagem, AtivoResultDto? Ativo)> CriarAtivoAsync(int gestorId, AtivoRequestDto dto)
    {
        var jaExiste = await _context.Ativos.AnyAsync(a => a.Ticker == dto.Ticker && a.CarteiraId == dto.CarteiraId);
        if (jaExiste) return (false, $"O ativo {dto.Ticker} já existe nesta carteira.", null);

        var novoAtivo = new Ativo
        {
            CarteiraId = dto.CarteiraId,
            Ticker = dto.Ticker,
            NomeEmpresa = dto.NomeEmpresa,
            PrecoTeto = dto.PrecoTeto,
            Vies = dto.Vies,
            Rentabilidade = dto.Rentabilidade,
            Vencimento = dto.Vencimento,
            Liquidez = dto.Liquidez,
            DataEntrada = dto.DataEntrada ?? DateTime.UtcNow,
            Categoria = dto.Categoria
        };

        if (string.IsNullOrWhiteSpace(novoAtivo.NomeEmpresa))
        {
            var (sucessoCotacao, _, dadosCotacao) = await _acoesService.ObterCotacaoAsync(novoAtivo.Ticker);
            
            novoAtivo.NomeEmpresa = (sucessoCotacao && dadosCotacao != null && !string.IsNullOrWhiteSpace(dadosCotacao.ShortName)) 
                                    ? dadosCotacao.ShortName : novoAtivo.Ticker;
        }

        _context.Ativos.Add(novoAtivo);

        var log = new HistoricoRecomendacaoCarteira
        {
            CarteiraId = novoAtivo.CarteiraId,
            GestorId = gestorId,
            Ticker = novoAtivo.Ticker,
            NomeAtivo = novoAtivo.NomeEmpresa ?? novoAtivo.Ticker,
            Acao = "Adicionou",
            Vies = novoAtivo.Vies,
            PrecoAlvo = novoAtivo.PrecoTeto ?? 0,
            Justificativa = "Inclusão inicial na carteira.",
            DataRecomendacao = DateTime.UtcNow
        };
        _context.HistoricoRecomendacoesCarteiras.Add(log);

        await _context.SaveChangesAsync();

        await _notificacaoService.DispararNotificacaoCarteiraAsync(
            novoAtivo.CarteiraId, 
            "🚨 Novo Ativo Adicionado", 
            $"O Gestor adicionou {novoAtivo.Ticker} na carteira. Confira a tese de investimentos!"
        );

        return (true, "Recomendação publicada com sucesso!", MapearParaDto(novoAtivo));
    }

    public async Task<(bool Sucesso, string Mensagem, AtivoResultDto? Ativo)> AtualizarAtivoAsync(int id, int gestorId, AtivoRequestDto dto)
    {
        var conflito = await _context.Ativos.AnyAsync(a => a.Ticker == dto.Ticker && a.CarteiraId == dto.CarteiraId && a.Id != id);
        if (conflito) return (false, "Já existe outro ativo com este ticker nesta carteira.", null);

        var ativoBanco = await _context.Ativos.FindAsync(id);
        if (ativoBanco == null) return (false, "Ativo não encontrado.", null);

        if (ativoBanco.Vies != dto.Vies || ativoBanco.PrecoTeto != dto.PrecoTeto)
        {
            var log = new HistoricoRecomendacaoCarteira
            {
                CarteiraId = dto.CarteiraId,
                GestorId = gestorId,
                Ticker = dto.Ticker,
                NomeAtivo = dto.NomeEmpresa ?? dto.Ticker,
                Acao = "Atualizou",
                Vies = dto.Vies,
                PrecoAlvo = dto.PrecoTeto ?? 0,
                Justificativa = "Atualização estratégica de viés ou preço teto.",
                DataRecomendacao = DateTime.UtcNow
            };
            _context.HistoricoRecomendacoesCarteiras.Add(log);
        }

        ativoBanco.Ticker = dto.Ticker;
        ativoBanco.PrecoTeto = dto.PrecoTeto;
        ativoBanco.Vies = dto.Vies;
        ativoBanco.NomeEmpresa = dto.NomeEmpresa; 
        ativoBanco.Rentabilidade = dto.Rentabilidade;
        ativoBanco.Vencimento = dto.Vencimento;
        ativoBanco.Liquidez = dto.Liquidez;
        ativoBanco.DataEntrada = dto.DataEntrada ?? ativoBanco.DataEntrada;
        ativoBanco.Categoria = dto.Categoria;

        await _context.SaveChangesAsync();

        await _notificacaoService.DispararNotificacaoCarteiraAsync(
            dto.CarteiraId, 
            "🔄 Recomendação Atualizada", 
            $"O Gestor alterou os parâmetros e o racional do ativo {dto.Ticker}. Confira as mudanças."
        );

        return (true, string.Empty, MapearParaDto(ativoBanco));
    }

    public async Task<(bool Sucesso, string Mensagem)> DeletarAtivoAsync(int id, int gestorId)
    {
        var ativo = await _context.Ativos.FindAsync(id);
        if (ativo == null) return (false, "Ativo não encontrado.");

        int carteiraId = ativo.CarteiraId;
        string ticker = ativo.Ticker;

        var log = new HistoricoRecomendacaoCarteira
        {
            CarteiraId = ativo.CarteiraId,
            GestorId = gestorId,
            Ticker = ativo.Ticker,
            NomeAtivo = ativo.NomeEmpresa ?? ativo.Ticker,
            Acao = "Excluiu",
            Vies = ativo.Vies,
            PrecoAlvo = ativo.PrecoTeto ?? 0,
            Justificativa = "Ativo removido da carteira pelo gestor.",
            DataRecomendacao = DateTime.UtcNow
        };
        _context.HistoricoRecomendacoesCarteiras.Add(log);

        _context.Ativos.Remove(ativo);
        await _context.SaveChangesAsync();

        await _notificacaoService.DispararNotificacaoCarteiraAsync(
            carteiraId, 
            "⚠️ Ativo Removido da Carteira", 
            $"O ativo {ticker} encerrou sua tese e foi removido da carteira pelo Gestor."
        );

        return (true, "Ativo removido com sucesso!");
    }

    private static AtivoResultDto MapearParaDto(Ativo ativo)
    {
        return new AtivoResultDto
        {
            Id = ativo.Id,
            CarteiraId = ativo.CarteiraId,
            Ticker = ativo.Ticker,
            NomeEmpresa = ativo.NomeEmpresa,
            PrecoTeto = ativo.PrecoTeto,
            Vies = ativo.Vies,
            Rentabilidade = ativo.Rentabilidade,
            Vencimento = ativo.Vencimento,
            Liquidez = ativo.Liquidez,
            DataEntrada = ativo.DataEntrada,
            Categoria = ativo.Categoria
        };
    }
}