using CaddieResearch.Api.DTOs.Chat;

namespace CaddieResearch.Api.Interfaces;

public interface IChatService
{
    Task<(bool Sucesso, string Mensagem, int ConversaId)> AbrirConversaAsync(int usuarioId, string assunto);
    Task<(bool Sucesso, string Mensagem, MensagemResultDto? NovaMensagem)> EnviarMensagemAsync(int conversaId, int usuarioId, string conteudo);
    Task<(bool Sucesso, string Mensagem, List<MensagemResultDto>? Mensagens)> BuscarMensagensAsync(int conversaId, int usuarioId);
    Task<List<ConversaResultDto>> MinhasConversasAsync(int usuarioId);
    Task<(bool Sucesso, string Mensagem, List<ConversaGestorResultDto>? Conversas)> TodasConversasGestorAsync(int gestorId);
    Task<(bool Sucesso, string Mensagem)> EncerrarConversaAsync(int conversaId, int gestorId);
    Task<(bool Sucesso, string Mensagem)> DeletarConversaAsync(int conversaId, int gestorId);
    Task<(bool Sucesso, string Mensagem, string Status)> VerificarStatusAsync(int conversaId);
}