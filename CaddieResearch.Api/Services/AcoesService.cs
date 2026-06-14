using Microsoft.Extensions.Caching.Memory;
using System.Text.Json;
using System.Text.Json.Serialization; 

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
    
    public async Task<List<string>> ObterTickersDisponiveisAsync()
    {
        if (_cache.TryGetValue("ListaTickers", out List<string>? tickersEmCache))
        {
            return tickersEmCache ?? new List<string>();
        }

        string token = _configuration["BrapiToken"];
        var response = await _httpClient.GetAsync($"https://brapi.dev/api/available?token={token}");

        if (!response.IsSuccessStatusCode) return new List<string>();

        var json = await response.Content.ReadAsStringAsync();
        using var doc = System.Text.Json.JsonDocument.Parse(json);
    
        var stocks = doc.RootElement.GetProperty("stocks").EnumerateArray()
            .Select(x => x.GetString() ?? string.Empty)
            .ToList();

        _cache.Set("ListaTickers", stocks, TimeSpan.FromHours(24));

        return stocks;
    }
    
    public async Task<List<string>> ObterTickersInternacionaisAsync()
    {
        if (_cache.TryGetValue("ListaTickersInt", out List<string>? tickersEmCache))
        {
            return tickersEmCache ?? new List<string>();
        }

        string token = _configuration["FinnhubToken"];
        var response = await _httpClient.GetAsync($"https://finnhub.io/api/v1/stock/symbol?exchange=US&token={token}");

        if (!response.IsSuccessStatusCode) return new List<string>();

        var json = await response.Content.ReadAsStringAsync();
        using var doc = System.Text.Json.JsonDocument.Parse(json);
    
        var stocks = doc.RootElement.EnumerateArray()
            .Select(x => x.GetProperty("symbol").GetString() ?? string.Empty)
            .Where(s => !string.IsNullOrWhiteSpace(s) && !s.Contains(".")) 
            .ToList();

        _cache.Set("ListaTickersInt", stocks, TimeSpan.FromHours(24));

        return stocks;
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
    public string LongName { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name => !string.IsNullOrEmpty(LongName) ? LongName : ShortName;
    public string Logourl { get; set; } = string.Empty;
    public decimal RegularMarketPrice { get; set; }
    public decimal RegularMarketChangePercent { get; set; }
}