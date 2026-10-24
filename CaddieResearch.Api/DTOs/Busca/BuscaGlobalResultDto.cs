namespace CaddieResearch.Api.DTOs.Busca;

/// <summary>
/// Representa um item encontrado na busca global da plataforma (Pode ser um Ativo, Relatório, Carteira, etc).
/// </summary>
public class BuscaGlobalResultDto
{
    /// <summary>
    /// Identificador único composto gerado para o frontend (ex: ativo-15).
    /// </summary>
    /// <example>ativo-15</example>
    public string Id { get; set; } = string.Empty;

    /// <summary>
    /// O ID real numérico da entidade no banco de dados.
    /// </summary>
    /// <example>15</example>
    public int RealId { get; set; }

    /// <summary>
    /// A categoria do item encontrado (Ativo, Relatorio, Carteira, Forum).
    /// </summary>
    /// <example>Ativo</example>
    public string Tipo { get; set; } = string.Empty;

    /// <summary>
    /// O título principal do resultado da busca.
    /// </summary>
    /// <example>Petrobras (PETR4)</example>
    public string Titulo { get; set; } = string.Empty;

    /// <summary>
    /// Tags associadas ao item para facilitar a filtragem visual.
    /// </summary>
    /// <example>["Energia", "Estatal", "Dividendos"]</example>
    public string[] Tags { get; set; } = Array.Empty<string>();

    /// <summary>
    /// Data em que o item foi publicado ou registrado.
    /// </summary>
    /// <example>2026-10-23T10:00:00Z</example>
    public DateTime? DataPublicacao { get; set; }

    /// <summary>
    /// Caminho do arquivo PDF caso o resultado seja um Relatório.
    /// </summary>
    /// <example>https://meublob.core.windows.net/relatorios/petr4.pdf</example>
    public string? ArquivoPdfUrl { get; set; }

    /// <summary>
    /// A rota ou URL relativa para redirecionar o usuário no frontend.
    /// </summary>
    /// <example>/ativos/15</example>
    public string Url { get; set; } = string.Empty;

    /// <summary>
    /// ID da carteira, caso o item pertença especificamente a uma carteira recomendada.
    /// </summary>
    /// <example>1</example>
    public int? CarteiraId { get; set; }

    /// <summary>
    /// Nível de assinatura exigido para acessar este conteúdo (0 = Grátis, 1 = Premium, etc).
    /// </summary>
    /// <example>1</example>
    public int NivelExigido { get; set; }
}