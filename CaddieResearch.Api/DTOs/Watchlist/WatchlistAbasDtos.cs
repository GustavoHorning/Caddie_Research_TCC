using System.ComponentModel.DataAnnotations;

namespace CaddieResearch.Api.DTOs.Watchlist;

public class CriarAbaRequestDto
{
    [Required(ErrorMessage = "O nome da aba é obrigatório.")]
    [MaxLength(50, ErrorMessage = "O nome da aba deve ter até 50 caracteres.")]
    /// <example>Ações de Tecnologia</example>
    public string Nome { get; set; } = string.Empty;
}

public class WatchlistAbaResultDto
{
    /// <example>1</example>
    public int Id { get; set; }
    
    /// <example>Ações de Tecnologia</example>
    public string Nome { get; set; } = string.Empty;
    
    /// <example>2026-10-23T10:00:00Z</example>
    public DateTime DataCriacao { get; set; }
    
    /// <example>["AAPL", "MSFT", "WEGE3"]</example>
    public List<string> Tickers { get; set; } = new();
}

/// <summary>
/// Resposta genérica para operações nas abas da watchlist.
/// </summary>
public class WatchlistAbaResponseDto
{
    /// <example>Operação realizada com sucesso.</example>
    public string Mensagem { get; set; } = string.Empty;
}