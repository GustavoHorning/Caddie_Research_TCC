using Microsoft.AspNetCore.Mvc;
using CaddieResearch.Api.Interfaces; 
using System.Threading.Tasks;

namespace CaddieResearch.Api.Controllers 
{
    [ApiController]
    [Route("api/[controller]")]
    public class IndicadoresController : ControllerBase
    {
        private readonly ITaxasMacroeconomicasService _taxasService; 

        public IndicadoresController(ITaxasMacroeconomicasService taxasService)
        {
            _taxasService = taxasService;
        }

        /// <summary>
        /// Retorna os principais indicadores macroeconômicos em tempo real.
        /// </summary>
        /// <remarks>
        /// Consome APIs externas para obter as taxas mais recentes (Ex: Selic, IPCA, Dólar, Euro) necessárias para os comparativos do Dashboard.
        /// </remarks>
        /// <response code="200">Indicadores carregados.</response>
        [HttpGet("macro")]
        [ProducesResponseType(200)]
        public async Task<IActionResult> ObterIndicadores()
        {
            var dados = await _taxasService.ObterTaxasAtuaisAsync();
            return Ok(dados);
        }
    }
}