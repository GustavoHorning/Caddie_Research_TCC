using System.Text.Json.Serialization;

namespace CaddieResearch.Api.DTOs.Ativos;

public class AtivoRequestDto
{
    public int CarteiraId { get; set; }
    public string Ticker { get; set; } = string.Empty;
    public string? NomeEmpresa { get; set; }
    public decimal? PrecoTeto { get; set; }
    public string? Vies { get; set; }
    public string? Rentabilidade { get; set; }
    public string? Vencimento { get; set; }
    public string? Liquidez { get; set; }
    public DateTime? DataEntrada { get; set; }
    public string? Categoria { get; set; }
}

public class AtivoResultDto
{
    public int Id { get; set; }
    public int CarteiraId { get; set; }
    public string Ticker { get; set; } = string.Empty;
    public string? NomeEmpresa { get; set; }
    public decimal? PrecoTeto { get; set; }
    public string? Vies { get; set; }
    public string? Rentabilidade { get; set; }
    public string? Vencimento { get; set; }
    public string? Liquidez { get; set; }
    
    public DateTime? DataEntrada { get; set; }
    
    public string? Categoria { get; set; }
}