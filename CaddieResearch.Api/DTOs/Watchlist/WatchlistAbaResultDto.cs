namespace CaddieResearch.Api.DTOs.Watchlist;

public class WatchlistAbaResultDto
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public DateTime DataCriacao { get; set; }
    public List<string> Tickers { get; set; } = new();
}