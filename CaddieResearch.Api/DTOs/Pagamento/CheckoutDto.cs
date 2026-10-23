namespace CaddieResearch.Api.DTOs.Pagamento;

public class CheckoutDto
{
    public string Plano { get; set; } = string.Empty;
    public string Metodo { get; set; } = string.Empty;
    public int UsuarioId { get; set; }
}