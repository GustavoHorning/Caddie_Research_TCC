namespace CaddieResearch.Api.DTOs.Carteiras;

/// <summary>
/// Representa uma carteira recomendada e seus metadados.
/// </summary>
public class CarteiraResultDto
{
    /// <example>1</example>
    public int Id { get; set; }

    /// <example>Carteira de Dividendos</example>
    public string Nome { get; set; } = string.Empty;

    /// <example>1</example>
    public int NivelAcesso { get; set; }

    /// <example>+ 12.5% ao ano</example>
    public string? Rentabilidade { get; set; }

    /// <summary>
    /// Lista de ativos que compõem esta carteira.
    /// </summary>
    public List<AtivoCarteiraDto> Ativos { get; set; } = new();
}

/// <summary>
/// Representa de forma enxuta um ativo dentro da carteira.
/// </summary>
public class AtivoCarteiraDto
{
    /// <example>10</example>
    public int Id { get; set; }

    /// <example>BBAS3</example>
    public string Ticker { get; set; } = string.Empty;

    /// <example>Banco do Brasil</example>
    public string? NomeEmpresa { get; set; }

    /// <example>Compra</example>
    public string? Vies { get; set; }

    /// <example>30.50</example>
    public decimal? PrecoTeto { get; set; }

    // CORREÇÃO: Propriedade que o frontend procura para preencher o "Recomendado em:"
    /// <example>2026-10-23T10:00:00Z</example>
    public DateTime? DataEntrada { get; set; }
    
    // CORREÇÃO: Categoria adicionada para exibir a tag (badge) no frontend
    /// <example>Ações</example>
    public string? Categoria { get; set; }
}