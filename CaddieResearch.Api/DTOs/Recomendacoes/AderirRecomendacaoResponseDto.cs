namespace CaddieResearch.Api.DTOs.Recomendacoes;



/// <summary>
/// Resposta padrão para aderir/recusar recomendação.
/// </summary>
public class AderirRecomendacaoResponseDto
{
    /// <example>Posição adicionada ao portfólio!</example>
    public string Mensagem { get; set; } = string.Empty;
    public CaddieResearch.Api.DTOs.Portfolio.PosicaoResultDto? Posicao { get; set; }
}