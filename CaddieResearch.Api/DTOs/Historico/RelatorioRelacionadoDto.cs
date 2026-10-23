namespace CaddieResearch.Api.DTOs.Historico;

public class RelatorioRelacionadoDto
{
    public int Id { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string Assunto { get; set; } = string.Empty;
    public DateTime DataPublicacao { get; set; }
    public string NomeCarteira { get; set; } = string.Empty;
    public bool Bloqueado { get; set; }
    public string PlanoMinimo { get; set; } = string.Empty;
}