namespace CaddieResearch.Api.DTOs.Notificacoes;

public class NotificacaoResultDto
{
    public int Id { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string Mensagem { get; set; } = string.Empty;
    public string Tipo { get; set; } = string.Empty;
    public string? LinkDestino { get; set; }
    public bool Lida { get; set; }
    public DateTime DataCriacao { get; set; }
}