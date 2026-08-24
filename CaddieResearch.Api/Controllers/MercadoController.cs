using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CaddieResearch.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class MercadoController : ControllerBase
{
    private readonly HttpClient _http;

    public MercadoController(IHttpClientFactory factory)
    {
        _http = factory.CreateClient("yahoo");
    }

    [HttpGet("historico")]
    public async Task<IActionResult> GetHistorico([FromQuery] string ticker, [FromQuery] string range = "1y", [FromQuery] string interval = "1d")
    {
        if (string.IsNullOrWhiteSpace(ticker)) return BadRequest("ticker obrigatório");

        var url = $"https://query1.finance.yahoo.com/v8/finance/chart/{Uri.EscapeDataString(ticker)}?interval={interval}&range={range}";

        try
        {
            var res = await _http.GetAsync(url);
            var body = await res.Content.ReadAsStringAsync();

            if (!res.IsSuccessStatusCode)
                return StatusCode((int)res.StatusCode, body);

            return Content(body, "application/json");
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }
}
