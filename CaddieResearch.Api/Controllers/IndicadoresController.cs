using Microsoft.AspNetCore.Mvc;
using SeuProjeto.Services;
using System.Threading.Tasks;

namespace SeuProjeto.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class IndicadoresController : ControllerBase
    {
        private readonly TaxasMacroeconomicasService _taxasService;

        public IndicadoresController(TaxasMacroeconomicasService taxasService)
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