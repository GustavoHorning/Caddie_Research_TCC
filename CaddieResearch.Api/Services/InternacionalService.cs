using Microsoft.Extensions.Caching.Memory;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace CaddieResearch.Api.Services;

public class InternacionalService
{
    private readonly HttpClient _httpClient;
    private readonly IMemoryCache _cache;
    private readonly IConfiguration _configuration;

    public InternacionalService(HttpClient httpClient, IMemoryCache cache, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _cache = cache;
        _configuration = configuration;
    }

    public async Task<InternacionalResponse?> ObterCotacaoUsdAsync(string ticker)
    {
        if (_cache.TryGetValue($"CotacaoInt_{ticker}", out InternacionalResponse? cotacaoEmCache))
        {
            return cotacaoEmCache;
        }

        try
        {
            string finnhubToken = _configuration["FinnhubToken"] ?? "";
            
            var responseAcao = await _httpClient.GetAsync($"https://finnhub.io/api/v1/quote?symbol={ticker.ToUpper()}&token={finnhubToken}");
            
            if (!responseAcao.IsSuccessStatusCode) return null;

            var jsonAcao = await responseAcao.Content.ReadAsStringAsync();
            var dadosFinnhub = JsonSerializer.Deserialize<FinnhubQuote>(jsonAcao, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            if (dadosFinnhub == null || dadosFinnhub.c == null || dadosFinnhub.c == 0) return null;
            
            var responseProfile = await _httpClient.GetAsync($"https://finnhub.io/api/v1/stock/profile2?symbol={ticker.ToUpper()}&token={finnhubToken}");
            FinnhubProfile? dadosProfile = null;

            if (responseProfile.IsSuccessStatusCode)
            {
                var jsonProfile = await responseProfile.Content.ReadAsStringAsync();
                dadosProfile = JsonSerializer.Deserialize<FinnhubProfile>(jsonProfile, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            }

            decimal valorDolar = 5.00m; 
            var responseDolar = await _httpClient.GetAsync("https://economia.awesomeapi.com.br/json/last/USD-BRL");
            
            if (responseDolar.IsSuccessStatusCode)
            {
                var jsonDolar = await responseDolar.Content.ReadAsStringAsync();
                var dadosMoeda = JsonSerializer.Deserialize<Dictionary<string, AwesomeApiCurrency>>(jsonDolar, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                
                if (dadosMoeda != null && dadosMoeda.ContainsKey("USDBRL"))
                {
                    decimal.TryParse(dadosMoeda["USDBRL"].ask, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out valorDolar);
                }
            }

            var cotacaoFinal = new InternacionalResponse
            {
                Symbol = ticker.ToUpper(),
                ShortName = !string.IsNullOrEmpty(dadosProfile?.Name) ? dadosProfile.Name : $"{ticker.ToUpper()} (EUA)", 
                LogoUrl = dadosProfile?.Logo ?? string.Empty,
                PriceUsd = dadosFinnhub.c ?? 0,
                ChangePercent = dadosFinnhub.dp ?? 0,
                ExchangeRate = valorDolar,
                PriceBrl = (dadosFinnhub.c ?? 0) * valorDolar
            };

            _cache.Set($"CotacaoInt_{ticker}", cotacaoFinal, TimeSpan.FromMinutes(5));

            return cotacaoFinal;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Erro ao buscar cotação internacional: {ex.Message}");
            return null;
        }
    }
}

public class FinnhubQuote
{
    public decimal? c { get; set; }  
    public decimal? dp { get; set; } 
}

public class FinnhubProfile
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty; 

    [JsonPropertyName("logo")]
    public string Logo { get; set; } = string.Empty; 
}

public class AwesomeApiCurrency
{
    public string ask { get; set; } = string.Empty;
}

public class InternacionalResponse
{
    public string Symbol { get; set; } = string.Empty;
    public string ShortName { get; set; } = string.Empty; 
    public string LogoUrl { get; set; } = string.Empty;   
    public decimal PriceUsd { get; set; }
    public decimal ChangePercent { get; set; }
    public decimal ExchangeRate { get; set; } 
    public decimal PriceBrl { get; set; }  
}