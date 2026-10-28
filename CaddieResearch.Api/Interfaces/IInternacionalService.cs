using CaddieResearch.Api.DTOs.Internacional;

namespace CaddieResearch.Api.Interfaces;

public interface IInternacionalService
{
    Task<InternacionalResponse?> ObterCotacaoUsdAsync(string ticker);
    
}