using CaddieResearch.Api.Data;
using CaddieResearch.Api.Models;

namespace CaddieResearch.Api.Workers;

public class BalancoCalendarioWorker : BackgroundService
{
    private readonly ILogger<BalancoCalendarioWorker> _logger;
    private readonly IServiceProvider _serviceProvider;

    public BalancoCalendarioWorker(ILogger<BalancoCalendarioWorker> logger, IServiceProvider serviceProvider)
    {
        _logger = logger;
        _serviceProvider = serviceProvider;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Robô de Balanços (Modo Simulação) acordou: {time}", DateTimeOffset.Now);

        try
        {
            await InjetarBalancosFicticios();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao injetar balanços simulados.");
        }
    }

    private async Task InjetarBalancosFicticios()
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var jaTemTeste = context.Eventos.Any(e => e.Tipo == "Balanço" && e.Titulo.Contains("WEGE3"));
        if (jaTemTeste) 
        {
            _logger.LogInformation("Balanços de teste já estão no banco. Nenhuma ação necessária.");
            return;
        }

        var hoje = DateTime.UtcNow;

        var balancosTeste = new List<Evento>
        {
            new Evento 
            {
                Titulo = "Resultado Trimestral - WEG",
                Descricao = "Divulgação dos resultados referentes ao último trimestre de WEGE3. Expectativa de alta na receita do exterior.",
                DataHora = hoje.Date.AddHours(18),
                Tipo = "Balanço",
                Impacto = 3, 
                Pais = "BR",
                TickerRelacionado = "WEGE3",
                LinkExterno = "https://ri.weg.net"
            },
            new Evento 
            {
                Titulo = "Resultado Trimestral - Petrobras",
                Descricao = "Divulgação de resultados PETR4 com foco na política de dividendos extraordinários.",
                DataHora = hoje.Date.AddDays(1).AddHours(9), 
                Tipo = "Balanço",
                Impacto = 3, 
                Pais = "BR",
                TickerRelacionado = "PETR4",
                LinkExterno = "https://ri.petrobras.com.br"
            },
            new Evento 
            {
                Titulo = "Resultado Trimestral - Vale",
                Descricao = "Resultados operacionais da Vale (VALE3). Foco na produção de minério de ferro.",
                DataHora = hoje.Date.AddDays(1).AddHours(19), 
                Tipo = "Balanço",
                Impacto = 2, 
                Pais = "BR",
                TickerRelacionado = "VALE3"
            }
        };

        context.Eventos.AddRange(balancosTeste);
        await context.SaveChangesAsync();

        _logger.LogInformation("Balanços fictícios (WEGE3, PETR4, VALE3) injetados com sucesso para testes da UI!");
    }
}