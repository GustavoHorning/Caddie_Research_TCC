using CaddieResearch.Api.Data;
using CaddieResearch.Api.Models;
using System.Text.Json;
using Microsoft.Extensions.Configuration;

namespace CaddieResearch.Api.Workers;

public class MacroCalendarioWorker : BackgroundService
{
    private readonly ILogger<MacroCalendarioWorker> _logger;
    private readonly IServiceProvider _serviceProvider;
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;

    public MacroCalendarioWorker(ILogger<MacroCalendarioWorker> logger, IServiceProvider serviceProvider, IConfiguration configuration)
    {
        _logger = logger;
        _serviceProvider = serviceProvider;
        _httpClient = new HttpClient(); 
        
        _apiKey = configuration["RapidApiKey"] ?? throw new InvalidOperationException("RapidApiKey não encontrada nos Secrets!");
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            _logger.LogInformation("Robô Macroeconômico (RapidAPI/TradingView) acordou: {time}", DateTimeOffset.Now);
            
            try
            {
                await BuscarEventosMacro();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Falha ao sincronizar calendário via RapidAPI.");
            }
            
            await Task.Delay(TimeSpan.FromDays(7), stoppingToken);
        }
    }

    private async Task BuscarEventosMacro()
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        DateTime margem = DateTime.UtcNow.AddDays(23);
        bool temDadosRecentes = context.Eventos.Any(e => e.Tipo == "Macro" && e.DataHora > margem);    
        
        if (temDadosRecentes)
        {
            _logger.LogInformation("Os eventos já estão no banco de dados. Pulando a chamada do RapidAPI para economizar cota!");
            return; 
        }

        string dataInicio = DateTime.UtcNow.ToString("yyyy-MM-dd");
        string dataFim = DateTime.UtcNow.AddDays(30).ToString("yyyy-MM-dd");

        string endpoint = $"https://economic-calendar9.p.rapidapi.com/web-crawling/api/economic-calendar/economic-events?countries=BR,US,EU,GB,CN,JP&from={dataInicio}&to={dataFim}";

        var request = new HttpRequestMessage
        {
            Method = HttpMethod.Get,
            RequestUri = new Uri(endpoint),
            Headers =
            {
                { "x-rapidapi-key", _apiKey },
                { "x-rapidapi-host", "economic-calendar9.p.rapidapi.com" },
            }
        };

        using var response = await _httpClient.SendAsync(request);
        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning($"RapidAPI recusou a conexão. Código: {response.StatusCode}");
            return;
        }

        var jsonStr = await response.Content.ReadAsStringAsync();
        
        var apiResponse = JsonSerializer.Deserialize<TradingViewApiResponse>(jsonStr, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        if (apiResponse?.Result == null || !apiResponse.Result.Any()) return;

        foreach (var evt in apiResponse.Result)
        {
            int impacto = 1; 
            if (evt.Importance == 1) impacto = 3;
            else if (evt.Importance == 0) impacto = 2;

            if (impacto < 2) continue;

            if (!DateTime.TryParse(evt.Date, out DateTime dataHora)) continue;

            DateTime dataHoraBrasilia = dataHora.ToUniversalTime().AddHours(-3);

            string unidade = evt.Unit ?? "";
            string projecao = evt.Forecast.HasValue ? $"{evt.Forecast}{unidade}" : "---";
            string valorAtual = evt.Actual.HasValue ? $"{evt.Actual}{unidade}" : (evt.Previous.HasValue ? $"{evt.Previous}{unidade}" : "---");

            string descricaoOriginal = string.IsNullOrWhiteSpace(evt.Comment) 
                ? "Macroeconomic indicator." 
                : evt.Comment;

            var novoEvento = new Evento
            {
                Titulo = evt.Title ?? "Macro Event",
                DataHora = dataHoraBrasilia,
                Tipo = "Macro",
                Impacto = impacto,
                Projecao = projecao,
                Atual = valorAtual, 
                Pais = evt.Country?.ToUpper() ?? "US", 
                Descricao = descricaoOriginal,
                LinkExterno = "https://tradingeconomics.com/calendar"
            };

            bool jaExiste = context.Eventos.Any(e => e.Titulo == novoEvento.Titulo && e.DataHora == novoEvento.DataHora);
    
            if (!jaExiste)
            {
                context.Eventos.Add(novoEvento);
            }
        }

        await context.SaveChangesAsync();
        _logger.LogInformation("Sucesso! Eventos Macro (incluindo BRASIL) gravados via TradingView!");
    }

    private class TradingViewApiResponse
    {
        public string Status { get; set; }
        public List<TradingViewEventDto> Result { get; set; }
    }

    private class TradingViewEventDto
    {
        public string Title { get; set; }
        public string Country { get; set; }
        public string Date { get; set; }
        public int? Importance { get; set; }
        public double? Forecast { get; set; }
        public double? Previous { get; set; }
        public double? Actual { get; set; }
        public string Unit { get; set; }
        public string Comment { get; set; }
    }
}