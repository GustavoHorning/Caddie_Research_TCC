using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace CaddieResearch.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AcoesController : ControllerBase
{
    private readonly HttpClient _http;

    public AcoesController(IHttpClientFactory factory)
    {
        _http = factory.CreateClient("yahoo");
    }

    [AllowAnonymous]
    [HttpGet("cotacao/{ticker}")]
    public async Task<IActionResult> GetCotacao(string ticker)
    {
        if (string.IsNullOrWhiteSpace(ticker)) return BadRequest("ticker obrigatório");

        var symbol = ticker.ToUpper();
        var url = $"https://brapi.dev/api/quote/{Uri.EscapeDataString(symbol)}";

        try
        {
            var res = await _http.GetAsync(url);
            var body = await res.Content.ReadAsStringAsync();

            if (!res.IsSuccessStatusCode)
                return StatusCode((int)res.StatusCode, body);

            using var doc = JsonDocument.Parse(body);
            var root = doc.RootElement;

            if (!root.TryGetProperty("results", out var results) || results.GetArrayLength() == 0)
                return NotFound($"Ticker {symbol} não encontrado");

            var q = results[0];

            var symbolOut = q.TryGetProperty("symbol", out var sym) ? sym.GetString() ?? symbol : symbol;
            var shortName = q.TryGetProperty("shortName", out var sn) ? sn.GetString() ?? symbol : symbol;
            var regularMarketPrice = q.TryGetProperty("regularMarketPrice", out var rmp) ? rmp.GetDouble() : 0;
            var changePercent = q.TryGetProperty("regularMarketChangePercent", out var cp) ? cp.GetDouble() : 0;
            var logourl = q.TryGetProperty("logourl", out var lu) ? lu.GetString() ?? "" : "";

            return Ok(new
            {
                symbol = symbolOut,
                shortName,
                logourl,
                regularMarketPrice,
                regularMarketChangePercent = changePercent
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }
}
