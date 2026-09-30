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

    [HttpGet("futuro")]
    public async Task<IActionResult> GetCotacaoFuturo([FromQuery] string ticker)
    {
        if (string.IsNullOrWhiteSpace(ticker)) return BadRequest("ticker obrigatório");

        var url = $"https://cotacao.b3.com.br/mds/api/v1/InstrumentQuotation/{ticker.ToUpper()}";

        try
        {
            using var req = new HttpRequestMessage(HttpMethod.Get, url);
            req.Headers.Add("Accept", "application/json");
            req.Headers.Add("Origin", "https://www.b3.com.br");
            req.Headers.Add("Referer", "https://www.b3.com.br/");

            var res = await _http.SendAsync(req);
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

    [HttpGet("cdi")]
    public async Task<IActionResult> GetCdi([FromQuery] string? dataInicial, [FromQuery] string? dataFinal)
    {
        // dataInicial e dataFinal no formato dd/MM/yyyy
        string url;
        if (!string.IsNullOrWhiteSpace(dataInicial) && !string.IsNullOrWhiteSpace(dataFinal))
            url = $"https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados?formato=json&dataInicial={dataInicial}&dataFinal={dataFinal}";
        else
            url = "https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados/ultimos/1?formato=json";

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
