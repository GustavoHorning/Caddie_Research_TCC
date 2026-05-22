using System;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Memory;

namespace SeuProjeto.Services
{
    public class TaxasMacroeconomicasService
    {
        private readonly HttpClient _httpClient;
        private readonly IMemoryCache _cache;
        private const string CacheKey = "TaxasMacro";

        public TaxasMacroeconomicasService(HttpClient httpClient, IMemoryCache cache)
        {
            _httpClient = httpClient;
            _cache = cache;
            _httpClient.DefaultRequestHeaders.Add("User-Agent", "CaddiePortfolioAppTCC");
        }

        public async Task<ResultadoTaxas> ObterTaxasAtuaisAsync()
        {
            if (_cache.TryGetValue(CacheKey, out ResultadoTaxas taxasSalvas))
            {
                return taxasSalvas;
            }

            var novasTaxas = new ResultadoTaxas();

            try
            {
                var respostaSelic = await _httpClient.GetStringAsync("https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json");
                using var docSelic = JsonDocument.Parse(respostaSelic);
                novasTaxas.Selic = docSelic.RootElement[0].GetProperty("valor").GetString() + "% a.a.";

                var respostaCdi = await _httpClient.GetStringAsync("https://api.bcb.gov.br/dados/serie/bcdata.sgs.4389/dados/ultimos/1?formato=json");
                using var docCdi = JsonDocument.Parse(respostaCdi);
                novasTaxas.Cdi = docCdi.RootElement[0].GetProperty("valor").GetString() + "% a.a.";
            }
            catch (Exception)
            {
                novasTaxas.Selic = "10.50% a.a.";
                novasTaxas.Cdi = "10.40% a.a.";
            }

            _cache.Set(CacheKey, novasTaxas, TimeSpan.FromHours(12));

            return novasTaxas;
        }
    }

    public class ResultadoTaxas
    {
        public string Selic { get; set; } = "---";
        public string Cdi { get; set; } = "---";
    }
}