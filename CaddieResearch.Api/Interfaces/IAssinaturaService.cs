using CaddieResearch.Api.Models;

namespace CaddieResearch.Api.Interfaces;

public interface IAssinaturaService
{
    Task ProcessarPagamentoAprovadoAsync(int usuarioId, string planoEscolhido, string metodoPagamento, decimal valorPago, string checkoutId);
    Task<Assinatura?> ObterAssinaturaAtivaAsync(int usuarioId);
    Task<Usuario?> CancelarAssinaturaAsync(int usuarioId);
    Task<int> ObterNivelAcessoAsync(int usuarioId);
    Task<Usuario?> VerificarStatusPagamentoAsync(int usuarioId, string planoDesejado);
}