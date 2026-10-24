namespace CaddieResearch.Api.DTOs.Favoritos;

/// <summary>
/// Dados necessários para adicionar um ativo à Watchlist do usuário.
/// </summary>
public class FavoritoDto
{
    /// <example>PETR4</example>
    public string Ticker { get; set; } = string.Empty;

    /// <example>Petrobras</example>
    public string? NomeEmpresa { get; set; }

    /// <example>Ações</example>
    public string? Categoria { get; set; }

    /// <example>+ 15.2%</example>
    public string? Rentabilidade { get; set; }

    /// <example>Carteira de Dividendos</example>
    public string? NomeCarteira { get; set; }
}

/// <summary>
/// Dados para atualizar a anotação pessoal de um ativo favoritado.
/// </summary>
public class AnotacaoDto
{
    /// <example>Aguardando o preço cair abaixo de R$ 35,00 para comprar.</example>
    public string Anotacao { get; set; } = string.Empty;
}

/// <summary>
/// Representa um ativo favoritado renderizado na tela do usuário.
/// </summary>
public class FavoritoResultDto
{
    /// <example>42</example>
    public int Id { get; set; }
    
    /// <example>PETR4</example>
    public string Ticker { get; set; } = string.Empty;
    
    /// <example>Petrobras</example>
    public string? NomeEmpresa { get; set; }
    
    /// <example>Ações</example>
    public string? Categoria { get; set; }
    
    /// <example>+ 15.2%</example>
    public string? Rentabilidade { get; set; }
    
    /// <example>Carteira de Dividendos</example>
    public string? NomeCarteira { get; set; }
    
    /// <example>Aguardando o preço cair...</example>
    public string? Anotacao { get; set; }
    
    /// <example>2026-10-23T10:00:00Z</example>
    public DateTime DataAdicionado { get; set; }
}