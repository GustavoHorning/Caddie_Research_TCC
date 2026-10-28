using CaddieResearch.Api.DTOs.Portfolio;

namespace CaddieResearch.Api.Interfaces;

public interface IPortfolioService
{
    Task<IEnumerable<PortfolioResultDto>> GetPortfoliosAsync(int usuarioId);
    Task<PortfolioDetalheResultDto?> GetPortfolioAsync(int id, int usuarioId);
    Task<PortfolioResultDto> CriarPortfolioAsync(int usuarioId, CriarPortfolioRequestDto req);
    Task<PosicaoResultDto?> AdicionarPosicaoAsync(int portfolioId, int usuarioId, PosicaoRequestDto dto);
    Task<bool> RemoverPosicaoAsync(int portfolioId, int posicaoId, int usuarioId);
}