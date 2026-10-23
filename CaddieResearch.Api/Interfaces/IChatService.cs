using CaddieResearch.Api.Models;

namespace CaddieResearch.Api.Interfaces;

public interface IChatService
{
    Task<Conversa> AbrirConversaAsync(int usuarioId, string assunto);
}