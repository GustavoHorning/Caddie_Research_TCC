using CaddieResearch.Api.DTOs.Indicadores;

namespace CaddieResearch.Api.Interfaces;

public interface ITaxasMacroeconomicasService
{
    Task<ResultadoTaxas> ObterTaxasAtuaisAsync();
}