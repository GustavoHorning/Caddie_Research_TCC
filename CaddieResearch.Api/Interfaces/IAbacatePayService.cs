namespace CaddieResearch.Api.Interfaces;

public interface IAbacatePayService
{
    Task<string> GerarCheckoutAsync(string nomePlano, string metodo, int usuarioId);
}