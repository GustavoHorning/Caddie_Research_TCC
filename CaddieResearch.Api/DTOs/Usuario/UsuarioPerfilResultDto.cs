namespace CaddieResearch.Api.DTOs.Usuario;

public class UsuarioPerfilResultDto
{
    public string Nome { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string TipoPerfil { get; set; } = string.Empty;
    public string? Plano { get; set; }
    public bool EhSocial { get; set; }
    public string? FotoPerfilUrl { get; set; }
    public string? DataVencimento { get; set; }
}