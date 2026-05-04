using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;

namespace CaddieResearch.Api.Services
{
    public class AbacatePayService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;

        public AbacatePayService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _configuration = configuration;

            var apiKey = _configuration["AbacatePay:ApiKey"];
            var baseUrl = _configuration["AbacatePay:BaseUrl"];

            _httpClient.BaseAddress = new Uri(baseUrl);
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        }

        public async Task<string> GerarCheckoutAsync(string nomePlano, string metodo, int usuarioId)
        {
            string productId = (nomePlano.ToLower(), metodo.ToLower()) switch
            {
                ("basic", "credito") => "prod_322yu06yqStXhpKaxhfjPQk2",
                ("basic", "pix") => "prod_krtEnht5mbMH6TcqR1Jtbex3",
                ("premium", "credito") => "prod_0CNRKpP0MWdkFyPSqD4mmJPP",
                ("premium", "pix") => "prod_cfmAPerbQmhC2Xbmkd3SgM4D",
                ("black", "credito") => "prod_QA16UWsdsrHhJubBQGg51EdN",
                ("black", "pix") => "prod_3WrFJ3rRqT3gfLwjZjFYNf34",
                _ => throw new Exception("Plano ou método de pagamento inválido.")
            };

            var metodosPagamento = metodo.ToLower() == "pix" ? new[] { "PIX" } : new[] { "CARD" };

            var payload = new
            {
                items = new[]
                {
                    new { id = productId, quantity = 1 }
                },
                methods = metodosPagamento,
                returnUrl = "http://localhost:5173/dashboard", 
                completionUrl = $"http://localhost:5173/pagamento-sucesso?plano={nomePlano.ToLower()}&metodo={metodo.ToLower()}", 
                metadata = new 
                { 
                    origem = "caddie-research-tcc",
                    planoEscolhido = nomePlano,
                    idUsuario = usuarioId.ToString(),
                    metodoPagamento = metodo
                },
                devMode = true
            };

            var json = JsonSerializer.Serialize(payload);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync("checkouts/create", content);

            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                throw new Exception($"Erro na AbacatePay: {error}");
            }

            var responseString = await response.Content.ReadAsStringAsync();
            using var jsonDoc = JsonDocument.Parse(responseString);
            
            return jsonDoc.RootElement.GetProperty("data").GetProperty("url").GetString();
        }
    }
}