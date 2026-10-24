namespace CaddieResearch.Api.DTOs.Assinatura;

/// <summary>
/// Representa o plano ativo atual do usuário.
/// </summary>
public class PlanoAtualResultDto
{
    /// <summary>
    /// Nome do plano vigente.
    /// </summary>
    /// <example>Premium Caddie</example>
    public string Plano { get; set; } = string.Empty;

    /// <summary>
    /// Data formatada de vencimento ou renovação do plano.
    /// </summary>
    /// <example>23/10/2026</example>
    public string Vencimento { get; set; } = string.Empty;
}

/// <summary>
/// Representa o resultado de uma solicitação de cancelamento.
/// </summary>
public class CancelamentoResultDto
{
    /// <summary>
    /// Mensagem de status da operação.
    /// </summary>
    /// <example>Plano cancelado com sucesso.</example>
    public string Mensagem { get; set; } = string.Empty;

    /// <summary>
    /// Novo token JWT com as permissões atualizadas (rebaixadas) do usuário.
    /// </summary>
    /// <example>eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</example>
    public string Token { get; set; } = string.Empty;
}