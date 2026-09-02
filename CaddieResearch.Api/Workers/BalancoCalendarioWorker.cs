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
        _logger.LogInformation("Robô de Balanços (Modo Mock Dinâmico Realista) iniciado.");

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

        var balancosAntigos = context.Eventos.Where(e => e.Tipo == "Balanço").ToList();
        if (balancosAntigos.Any())
        {
            context.Eventos.RemoveRange(balancosAntigos);
            await context.SaveChangesAsync();
        }

        var hoje = DateTime.UtcNow.Date;

        var balancosTeste = new List<Evento>
        {
            new Evento { Titulo = "Balanço: WEGE3", Descricao = "Resultados do trimestre de WEG. Expectativa de margens resilientes no mercado externo.", DataHora = hoje.AddDays(1).AddHours(18), Tipo = "Balanço", Impacto = 3, Pais = "BR", TickerRelacionado = "WEGE3" },
            
            new Evento { Titulo = "Balanço: PETR4", Descricao = "Resultados Petrobras. Foco na política de distribuição de dividendos extraordinários.", DataHora = hoje.AddDays(3).AddHours(18), Tipo = "Balanço", Impacto = 3, Pais = "BR", TickerRelacionado = "PETR4" },
            
            new Evento { Titulo = "Balanço: VALE3", Descricao = "Resultados operacionais da Vale. Atenção ao custo C1 e variação do preço do minério de ferro.", DataHora = hoje.AddDays(5).AddHours(19), Tipo = "Balanço", Impacto = 3, Pais = "BR", TickerRelacionado = "VALE3" },
            
            new Evento { Titulo = "Balanço: ITUB4", Descricao = "Itaú Unibanco. Foco na evolução da inadimplência e crescimento da carteira de crédito.", DataHora = hoje.AddDays(7).AddHours(18), Tipo = "Balanço", Impacto = 3, Pais = "BR", TickerRelacionado = "ITUB4" },
            
            new Evento { Titulo = "Balanço: RENT3", Descricao = "Localiza. Destaque para o ritmo de renovação da frota e custos de depreciação.", DataHora = hoje.AddDays(9).AddHours(18), Tipo = "Balanço", Impacto = 2, Pais = "BR", TickerRelacionado = "RENT3" },
            
            new Evento { Titulo = "Balanço: BBAS3", Descricao = "Banco do Brasil. Expectativa sobre a carteira do agronegócio e Provisões (PDD).", DataHora = hoje.AddDays(11).AddHours(8), Tipo = "Balanço", Impacto = 3, Pais = "BR", TickerRelacionado = "BBAS3" },
            
            new Evento { Titulo = "Balanço: SMTO3", Descricao = "São Martinho. Mercado acompanha volume de moagem e curva de preços do açúcar.", DataHora = hoje.AddDays(13).AddHours(18), Tipo = "Balanço", Impacto = 2, Pais = "BR", TickerRelacionado = "SMTO3" },
        };

        context.Eventos.AddRange(balancosTeste);
        await context.SaveChangesAsync();

        _logger.LogInformation($"Mocks realistas inseridos com sucesso! {balancosTeste.Count} balanços espalhados para as próximas 2 semanas.");
    }
}