using CaddieResearch.Api.Data;
using CaddieResearch.Api.DTOs.Carteiras;
using CaddieResearch.Api.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace CaddieResearch.Api.Services;

public class CarteirasService : ICarteirasService
{
    private readonly AppDbContext _context;
    private readonly IAssinaturaService _assinaturaService;

    public CarteirasService(AppDbContext context, IAssinaturaService assinaturaService)
    {
        _context = context;
        _assinaturaService = assinaturaService;
    }

    public async Task<(bool Sucesso, string Mensagem, List<CarteiraResultDto>? Carteiras)> ObterCarteirasPermitidasAsync(int usuarioId)
    {
        int nivelPermitido = await _assinaturaService.ObterNivelAcessoAsync(usuarioId);

        var carteiras = await _context.Carteiras
            .Include(c => c.Ativos)
            .Where(c => c.NivelAcesso <= nivelPermitido)
            .Select(c => new CarteiraResultDto
            {
                Id = c.Id,
                Nome = c.Nome,
                NivelAcesso = c.NivelAcesso,
                Rentabilidade = c.Rentabilidade,
                Ativos = c.Ativos.Select(a => new AtivoCarteiraDto
                {
                    Id = a.Id,
                    Ticker = a.Ticker,
                    NomeEmpresa = a.NomeEmpresa,
                    Vies = a.Vies,
                    PrecoTeto = a.PrecoTeto,
                    DataEntrada = a.DataEntrada, 
                    Categoria = a.Categoria
                }).ToList()
            })
            .ToListAsync();

        return (true, string.Empty, carteiras);
    }

    public async Task<(bool Sucesso, string Mensagem, CarteiraResultDto? Carteira)> ObterCarteiraDetalhadaAsync(int carteiraId, int usuarioId)
    {
        int nivelPermitido = await _assinaturaService.ObterNivelAcessoAsync(usuarioId);

        var carteira = await _context.Carteiras
            .Include(c => c.Ativos)
            .FirstOrDefaultAsync(c => c.Id == carteiraId);

        if (carteira == null)
            return (false, "Carteira não encontrada.", null);

        if (carteira.NivelAcesso > nivelPermitido)
            return (false, "Seu plano não permite acessar esta carteira.", null);

        var dto = new CarteiraResultDto
        {
            Id = carteira.Id,
            Nome = carteira.Nome,
            NivelAcesso = carteira.NivelAcesso,
            Rentabilidade = carteira.Rentabilidade,
            Ativos = carteira.Ativos.Select(a => new AtivoCarteiraDto
            {
                Id = a.Id,
                Ticker = a.Ticker,
                NomeEmpresa = a.NomeEmpresa,
                Vies = a.Vies,
                PrecoTeto = a.PrecoTeto,
                DataEntrada = a.DataEntrada, 
                Categoria = a.Categoria
            }).ToList()
        };

        return (true, string.Empty, dto);
    }
}