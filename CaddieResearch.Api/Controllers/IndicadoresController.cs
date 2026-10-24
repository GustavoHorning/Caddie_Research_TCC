using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using CaddieResearch.Api.Interfaces; 
using CaddieResearch.Api.DTOs.Indicadores;

namespace CaddieResearch.Api.Controllers 
{
    /// <summary>
    /// Fornece dados macroeconômicos e indicadores de mercado atualizados.
    /// </summary>
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
        /// Consome APIs externas para obter as taxas mais recentes (Ex: Selic, CDI) necessárias para os comparativos do Dashboard.
        /// </remarks>
        /// <response code="200">Indicadores carregados com sucesso.</response>
        [HttpGet("macro")]
        [ProducesResponseType(typeof(ResultadoTaxas), StatusCodes.Status200OK)]
        public async Task<IActionResult> ObterIndicadores()
        {
            var dados = await _taxasService.ObterTaxasAtuaisAsync();
            return Ok(dados);
        }
    }
}