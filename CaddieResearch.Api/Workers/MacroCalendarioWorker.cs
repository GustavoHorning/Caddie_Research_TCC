using CaddieResearch.Api.Data;
using CaddieResearch.Api.Models;
using CaddieResearch.Api.DTOs;
using System.Text.Json;

namespace CaddieResearch.Api.Workers;

public class MacroCalendarioWorker : BackgroundService
{
    private readonly ILogger<MacroCalendarioWorker> _logger;
    private readonly IServiceProvider _serviceProvider;
    private readonly HttpClient _httpClient;

    public MacroCalendarioWorker(ILogger<MacroCalendarioWorker> logger, IServiceProvider serviceProvider)
    {
        _logger = logger;
        _serviceProvider = serviceProvider;
        _httpClient = new HttpClient(); 
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            _logger.LogInformation("Robô Macroeconômico Inteligente acordou: {time}", DateTimeOffset.Now);

            try
            {
                await BuscarEventosMacro();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Falha ao buscar dados da API pública.");
            }

            await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
        }
    }

    private async Task BuscarEventosMacro()
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var response = await _httpClient.GetAsync("https://nfs.faireconomy.media/ff_calendar_thisweek.json");
        
        if (!response.IsSuccessStatusCode) 
        {
            _logger.LogWarning($"A API recusou a conexão. Código: {response.StatusCode}");
            return;
        }

        var jsonStr = await response.Content.ReadAsStringAsync();
        var eventos = JsonSerializer.Deserialize<List<MacroEventDto>>(jsonStr, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        if (eventos == null) return;

        var moedasAlvo = new[] { "BRL", "USD", "EUR", "CNY", "GBP", "JPY", "CAD", "AUD", "CHF" };

        foreach (var evt in eventos)
        {
            if (string.IsNullOrEmpty(evt.Country) || !moedasAlvo.Contains(evt.Country.ToUpper())) continue;

            int impacto = evt.Impact?.ToLower() == "high" ? 3 : evt.Impact?.ToLower() == "medium" ? 2 : 1;
            
            if (impacto < 2) continue;

            if (!DateTime.TryParse(evt.Date, out DateTime dataHora)) continue;
            
            dataHora = dataHora.ToUniversalTime();

            string siglaPais = evt.Country.ToUpper() switch
            {
                "USD" => "US",
                "EUR" => "EU",
                "BRL" => "BR",
                "GBP" => "UK",
                "JPY" => "JP",
                "CNY" => "CN",
                "CAD" => "CA",
                "AUD" => "AU",
                "CHF" => "CH",
                _ => evt.Country.ToUpper()
            };

            string tituloLower = evt.Title?.ToLower() ?? "";
            string descricaoEnriquecida = "Indicador macroeconômico com potencial de gerar volatilidade nos mercados.";
            
            string linkDia = dataHora.ToString("MMMdd", System.Globalization.CultureInfo.InvariantCulture).ToLower();
            string urlExterna = $"https://www.forexfactory.com/calendar?day={linkDia}";

            if (tituloLower.Contains("cpi") || tituloLower.Contains("inflation") || tituloLower.Contains("ipca"))
                descricaoEnriquecida = "Índice de Preços ao Consumidor (Inflação). Números acima da projeção costumam fortalecer a moeda local e pressionar os juros.";
            else if (tituloLower.Contains("gdp") || tituloLower.Contains("pib"))
                descricaoEnriquecida = "Produto Interno Bruto (PIB). Principal termômetro da atividade e saúde econômica do país.";
            else if (tituloLower.Contains("payroll") || tituloLower.Contains("employment") || tituloLower.Contains("unemployment") || tituloLower.Contains("jobless"))
                descricaoEnriquecida = "Relatório de mercado de trabalho. Um dos eventos que mais gera volatilidade instantânea nas bolsas e moedas globais.";
            else if (tituloLower.Contains("rate") || tituloLower.Contains("fed") || tituloLower.Contains("boe") || tituloLower.Contains("ecb") || tituloLower.Contains("selic"))
                descricaoEnriquecida = "Decisão de Taxa de Juros. O evento mais importante para o país, definindo o custo do dinheiro e o fluxo de capital estrangeiro.";
            else if (tituloLower.Contains("pmi"))
                descricaoEnriquecida = "Índice de Gerentes de Compras (PMI). Um indicador antecedente importante sobre o aquecimento da indústria e serviços.";

            var novoEvento = new Evento
            {
                Titulo = evt.Title ?? "Evento Macro",
                DataHora = dataHora,
                Tipo = "Macro",
                Impacto = impacto,
                Projecao = evt.Forecast ?? "---",
                Atual = evt.Previous ?? "---", 
                Pais = siglaPais,
                Descricao = descricaoEnriquecida,
                LinkExterno = urlExterna
            };

            bool jaExiste = context.Eventos.Any(e => e.Titulo == novoEvento.Titulo && e.DataHora == novoEvento.DataHora);
            
            if (!jaExiste)
            {
                context.Eventos.Add(novoEvento);
            }
        }

        await context.SaveChangesAsync();
        _logger.LogInformation("Eventos Macroeconômicos sincronizados com o banco de dados!");
    }
}