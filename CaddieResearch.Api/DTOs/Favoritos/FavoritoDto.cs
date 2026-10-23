namespace CaddieResearch.Api.DTOs.Favoritos;

public class FavoritoDto
{
    public string Ticker { get; set; } = string.Empty;
    public string? NomeEmpresa { get; set; }
    public string? Categoria { get; set; }
    public string? Rentabilidade { get; set; }
    public string? NomeCarteira { get; set; }
}