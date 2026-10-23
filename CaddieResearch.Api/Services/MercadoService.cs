using CaddieResearch.Api.Interfaces;

namespace CaddieResearch.Api.Services;

public class MercadoService : IMercadoService
{
    private readonly HttpClient _http;

    public MercadoService(IHttpClientFactory factory)
    {
        _http = factory.CreateClient("yahoo");
    }

    public async Task<string> ObterHistoricoYahooAsync(string ticker, string range, string interval)
    {
        var url = $"https://query1.finance.yahoo.com/v8/finance/chart/{Uri.EscapeDataString(ticker)}?interval={interval}&range={range}";
        
        var res = await _http.GetAsync(url);
        res.EnsureSuccessStatusCode(); 
        
        return await res.Content.ReadAsStringAsync();
    }

    public async Task<string> ObterCotacaoFuturoB3Async(string ticker)
    {
        var url = $"https://cotacao.b3.com.br/mds/api/v1/InstrumentQuotation/{ticker.ToUpper()}";
        
        using var req = new HttpRequestMessage(HttpMethod.Get, url);
        req.Headers.Add("Accept", "application/json");
        req.Headers.Add("Origin", "https://www.b3.com.br");
        req.Headers.Add("Referer", "https://www.b3.com.br/");

        var res = await _http.SendAsync(req);
        res.EnsureSuccessStatusCode();
        
        return await res.Content.ReadAsStringAsync();
    }

    public async Task<string> ObterCdiBcbAsync(string? dataInicial, string? dataFinal)
    {
        string url;
        if (!string.IsNullOrWhiteSpace(dataInicial) && !string.IsNullOrWhiteSpace(dataFinal))
            url = $"https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados?formato=json&dataInicial={dataInicial}&dataFinal={dataFinal}";
        else
            url = "https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados/ultimos/1?formato=json";

        var res = await _http.GetAsync(url);
        res.EnsureSuccessStatusCode();
        
        return await res.Content.ReadAsStringAsync();
    }
}