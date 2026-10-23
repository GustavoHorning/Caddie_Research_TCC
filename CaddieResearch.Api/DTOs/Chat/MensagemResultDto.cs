namespace CaddieResearch.Api.DTOs.Chat;

public class MensagemResultDto
{
    public int Id { get; set; }
    public string Conteudo { get; set; } = string.Empty;
    public bool EhGestor { get; set; }
    public bool Lida { get; set; }
    public DateTime DataEnvio { get; set; }
    public string NomeRemetente { get; set; } = string.Empty;
}