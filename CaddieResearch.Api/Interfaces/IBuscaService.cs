using CaddieResearch.Api.DTOs.Busca;

namespace CaddieResearch.Api.Interfaces;

public interface IBuscaService
{
    Task<IEnumerable<BuscaGlobalResultDto>> BuscarGlobalAsync(string termo, int usuarioId);
}