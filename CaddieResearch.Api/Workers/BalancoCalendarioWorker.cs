using System;
using System.Linq; 
using System.Net.Http;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using CaddieResearch.Api.Data;
using CaddieResearch.Api.Models; 

namespace CaddieResearch.Api.Workers
{
    public class BalancoCalendarioWorker : BackgroundService
    {
        private readonly ILogger<BalancoCalendarioWorker> _logger;
        private readonly IServiceProvider _serviceProvider;
        private readonly IConfiguration _configuration;
        private readonly HttpClient _httpClient;

        public BalancoCalendarioWorker(
            ILogger<BalancoCalendarioWorker> logger, 
            IServiceProvider serviceProvider, 
            IConfiguration configuration)
        {
            _logger = logger;
            _serviceProvider = serviceProvider;
            _configuration = configuration;
            _httpClient = new HttpClient();
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Robô de Balanços Globais (Finnhub) iniciado.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await BuscarBalancosFinnhub();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Falha ao sincronizar balanços via Finnhub.");
                }

                await Task.Delay(TimeSpan.FromDays(1), stoppingToken);
            }
        }

        private async Task BuscarBalancosFinnhub()
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            

            string apiKey = _configuration["Finnhub:ApiKey"]; 
            
            if (string.IsNullOrEmpty(apiKey))
            {
                _logger.LogError("ERRO CRÍTICO: Chave da Finnhub não encontrada nos Secrets!");
                return;
            }
            
            string dataInicio = DateTime.UtcNow.ToString("yyyy-MM-dd");
            string dataFim = DateTime.UtcNow.AddDays(90).ToString("yyyy-MM-dd");

            string url = $"https://finnhub.io/api/v1/calendar/earnings?from={dataInicio}&to={dataFim}&token={apiKey}";
            
            var response = await _httpClient.GetAsync(url);
            response.EnsureSuccessStatusCode();
            var jsonResponse = await response.Content.ReadAsStringAsync();

            using JsonDocument doc = JsonDocument.Parse(jsonResponse);
            var earnings = doc.RootElement.GetProperty("earningsCalendar");

            int contador = 0;

            foreach (var evt in earnings.EnumerateArray())
            {
                string ticker = evt.GetProperty("symbol").GetString();

                long? revEstimate = evt.GetProperty("revenueEstimate").ValueKind != JsonValueKind.Null 
                    ? evt.GetProperty("revenueEstimate").GetInt64() 
                    : null;

                if (revEstimate == null || revEstimate < 1_000_000_000) 
                    continue;

                if (!DateTime.TryParse(evt.GetProperty("date").GetString(), out DateTime dataBalanco)) 
                    continue;

                double? epsEstimate = evt.GetProperty("epsEstimate").ValueKind != JsonValueKind.Null ? evt.GetProperty("epsEstimate").GetDouble() : null;
                double? epsActual = evt.GetProperty("epsActual").ValueKind != JsonValueKind.Null ? evt.GetProperty("epsActual").GetDouble() : null;

                string projecaoStr = epsEstimate.HasValue ? $"EPS: ${epsEstimate:F2}" : "---";
                string atualStr = epsActual.HasValue ? $"EPS: ${epsActual:F2}" : "---";
                string receitaFormatada = $"${(revEstimate / 1_000_000_000.0):F2} Bilhões";

    string pais = "US"; 

    string[] adrsBr = { "PBR", "VALE", "ITUB", "NU", "ABEV", "BBD", "BSBR", "CIG", "GGB", "SUZ" }; 
    string[] adrsCa = { "SHOP", "RY", "TD", "ENB", "CNQ", "BMO", "BNS", "CP" };
    string[] adrsMx = { "AMX", "CX", "FMX", "KOF" };
    string[] adrsLatam = { "MELI", "EC", "BMA", "GGAL" }; 

    string[] adrsGb = { "SHEL", "BP", "HSBC", "UL", "AZN", "GSK", "LSEG" }; 
    string[] adrsDe = { "SAP", "SIEGY", "BNTX", "BMWYY", "VWAGY" };
    string[] adrsFr = { "TTE", "SNY", "LVMUY", "ORAN" }; 
    string[] adrsCh = { "NVS", "UBS", "NSRGY", "ABB" }; 
    string[] adrsNl = { "ASML", "ING", "NXPI", "PHG" }; 
    string[] adrsDk = { "NVO" }; 

    string[] adrsCn = { "BABA", "JD", "PDD", "NIO", "BIDU", "NTES", "LI", "XPEV" }; 
    string[] adrsJp = { "SONY", "TM", "HMC", "MUFG", "SMFG", "MFG" }; 
    string[] adrsTw = { "TSM", "UMC" }; 
    string[] adrsIn = { "INFY", "HDB", "IBN", "TTM", "WIT" }; 
    string[] adrsKr = { "CPNG", "PKX", "KB" };
    string[] adrsAu = { "BHP", "RIO", "TEAM", "WMC" }; 
    
    if (adrsBr.Contains(ticker)) pais = "BR";
    else if (adrsCa.Contains(ticker)) pais = "CA";
    else if (adrsMx.Contains(ticker)) pais = "MX";
    else if (adrsLatam.Contains(ticker)) pais = ticker == "EC" ? "CO" : "AR";
    else if (adrsGb.Contains(ticker)) pais = "GB";
    else if (adrsDe.Contains(ticker)) pais = "DE"; 
    else if (adrsFr.Contains(ticker)) pais = "FR"; 
    else if (adrsCh.Contains(ticker)) pais = "CH"; 
    else if (adrsNl.Contains(ticker)) pais = "NL"; 
    else if (adrsDk.Contains(ticker)) pais = "DK"; 
    else if (adrsCn.Contains(ticker)) pais = "CN";
    else if (adrsJp.Contains(ticker)) pais = "JP";
    else if (adrsTw.Contains(ticker)) pais = "TW";
    else if (adrsIn.Contains(ticker)) pais = "IN";
    else if (adrsKr.Contains(ticker)) pais = "KR"; 
    else if (adrsAu.Contains(ticker)) pais = "AU"; 

                var novoEvento = new Evento
                {
                    Titulo = $"Resultado do Trimestre: {ticker}",
                    DataHora = dataBalanco.ToUniversalTime(),
                    Tipo = "Balanço",
                    Impacto = 3, 
                    Projecao = projecaoStr,
                    Atual = atualStr,
                    TickerRelacionado = ticker,
                    Pais = pais, 
                    Descricao = $"Balanço corporativo global.\n\nProjeção de Lucro por Ação (EPS): {projecaoStr}\nProjeção de Receita: {receitaFormatada}.",
                    LinkExterno = $"https://finance.yahoo.com/quote/{ticker}"
                };

                var eventoExistente = context.Eventos.FirstOrDefault(e => e.TickerRelacionado == ticker && e.DataHora == novoEvento.DataHora);

                if (eventoExistente == null)
                {
                    context.Eventos.Add(novoEvento);
                    contador++;
                }
                else if (eventoExistente.Atual == "---" && atualStr != "---")
                {
                    eventoExistente.Atual = atualStr;
                    _logger.LogInformation($"Resultado divulgado e atualizado para {ticker}: {atualStr}");
                }
            }

            await context.SaveChangesAsync();
            _logger.LogInformation($"Sucesso! {contador} Balanços Globais (Acima de $1B) inseridos via Finnhub.");
        }
    }
}