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

        [HttpGet("macro")]
        public async Task<IActionResult> ObterIndicadores()
        {
            var dados = await _taxasService.ObterTaxasAtuaisAsync();
            return Ok(dados);
        }
    }
}