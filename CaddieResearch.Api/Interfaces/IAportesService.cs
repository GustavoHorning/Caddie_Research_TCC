using CaddieResearch.Api.DTOs.Portfolio;

namespace CaddieResearch.Api.Interfaces;

public interface IAportesService
{
    Task<(bool Sucesso, string Mensagem, List<AporteResultDto>? Aportes)> ObterAportesAsync(int portfolioId, int usuarioId);
    Task<(bool Sucesso, string Mensagem, AporteResultDto? Aporte)> CadastrarAporteAsync(int portfolioId, int usuarioId, AporteRequestDto dto);
    Task<(bool Sucesso, string Mensagem)> RemoverAporteAsync(int portfolioId, int id, int usuarioId);
}