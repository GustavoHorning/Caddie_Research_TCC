namespace CaddieResearch.Api.DTOs.Notificacoes;

public class DispararNotificacaoDto
{
    public string Titulo { get; set; } = string.Empty;
    public string Mensagem { get; set; } = string.Empty;
    public string Tipo { get; set; } = "Info";
    public string? LinkDestino { get; set; }
}