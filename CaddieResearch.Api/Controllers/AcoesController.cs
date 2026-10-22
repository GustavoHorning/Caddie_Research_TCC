using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace CaddieResearch.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AcoesController : ControllerBase
{
    private readonly HttpClient _http;
    private readonly IConfiguration _configuration;

    public AcoesController(IHttpClientFactory factory, IConfiguration configuration)
    {
        _http = factory.CreateClient("yahoo");
        _configuration = configuration;
    }

    /// <summary>
    /// Retorna a cotação em tempo real de uma ação (B3).
    /// </summary>
    /// <remarks>
    /// Consulta o provedor de dados de mercado para buscar o preço atual, a variação percentual do dia e o logotipo da empresa associada ao ticker informado.
    /// </remarks>
    /// <param name="ticker">O código de negociação da ação na bolsa. Ex: PETR4, VALE3</param>
    /// <response code="200">Cotação retornada com sucesso.</response>
    /// <response code="400">O parâmetro ticker é obrigatório.</response>
    /// <response code="404">Ticker não encontrado no provedor de dados.</response>
    /// <response code="500">Erro de comunicação com o serviço externo.</response>
    [AllowAnonymous]
    [HttpGet("cotacao/{ticker}")]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    [ProducesResponseType(500)]
    public async Task<IActionResult> GetCotacao(string ticker)
    {
        if (string.IsNullOrWhiteSpace(ticker)) return BadRequest("ticker obrigatório");

        var symbol = ticker.ToUpper();
        var brapiToken = _configuration["BrapiToken"];
        
        var url = $"https://brapi.dev/api/quote/{Uri.EscapeDataString(symbol)}?token={brapiToken}";

        try
        {
            var res = await _http.GetAsync(url);
            var body = await res.Content.ReadAsStringAsync();

            if (!res.IsSuccessStatusCode)
                return StatusCode((int)res.StatusCode, $"Erro Brapi: {body}");

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