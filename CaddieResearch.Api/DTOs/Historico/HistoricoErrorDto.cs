namespace CaddieResearch.Api.DTOs.Historico;

public class HistoricoErrorDto
{
    /// <example>Seu plano não permite visualizar o histórico desta carteira.</example>
    public string Mensagem { get; set; } = string.Empty;
}