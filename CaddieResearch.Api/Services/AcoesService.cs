using Microsoft.Extensions.Caching.Memory;
using System.Text.Json;

namespace CaddieResearch.Api.Services;

public class AcoesService
{
    private readonly HttpClient _httpClient;
    private readonly IMemoryCache _cache;
    private readonly IConfiguration _configuration;

    public AcoesService(HttpClient httpClient, IMemoryCache cache, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _cache = cache;
        _configuration = configuration;
    }

    public async Task<BrapiResponse?> ObterCotacaoAsync(string ticker)
    {
        if (_cache.TryGetValue($"Cotacao_{ticker}", out BrapiResponse? cotacaoEmCache))
        {
            return cotacaoEmCache;
        }

        string token = _configuration["BrapiToken"];
        var response = await _httpClient.GetAsync($"https://brapi.dev/api/quote/{ticker}?token={token}");

        if (!response.IsSuccessStatusCode) return null;

        var json = await response.Content.ReadAsStringAsync();
        var dadosBrapi = JsonSerializer.Deserialize<BrapiResult>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        var cotacao = dadosBrapi?.Results?.FirstOrDefault();

        if (cotacao != null)
        {
            var opcoesCache = new MemoryCacheEntryOptions().SetAbsoluteExpiration(TimeSpan.FromMinutes(5));
            _cache.Set($"Cotacao_{ticker}", cotacao, opcoesCache);
        }

        return cotacao;
    }
}

public class BrapiResult
{
    public List<BrapiResponse>? Results { get; set; }
}

public class BrapiResponse
{
    public string Symbol { get; set; } = string.Empty;
    public string ShortName { get; set; } = string.Empty;
    public string Logourl { get; set; } = string.Empty;
    public decimal RegularMarketPrice { get; set; }
    public decimal RegularMarketChangePercent { get; set; }
}