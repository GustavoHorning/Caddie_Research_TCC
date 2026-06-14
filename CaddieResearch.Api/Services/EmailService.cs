using Azure;
using Azure.Communication.Email;

namespace CaddieResearch.Api.Services;

public class EmailService
{
    private readonly IConfiguration _configuration;

    public EmailService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public async Task EnviarEmailConfirmacaoAsync(string emailDestino, string nomeDestino, string linkConfirmacao)
    {
        var connectionString = _configuration["AzureEmail:ConnectionString"];
        var senderAddress = _configuration["AzureEmail:Sender"];

        var emailClient = new EmailClient(connectionString);

        var htmlContent = $@"
            <div style='font-family: Arial, sans-serif; color: #333; padding: 20px;'>
                <h2>Olá, {nomeDestino}!</h2>
                <p>Bem-vindo(a) ao Caddie Research.</p>
                <p>Para ativar sua conta e liberar seu acesso, por favor, confirme seu e-mail clicando no botão abaixo:</p>
                <a href='{linkConfirmacao}' style='display: inline-block; padding: 10px 20px; background-color: #007bff; color: #fff; text-decoration: none; border-radius: 5px; margin-top: 15px;'>Confirmar Meu E-mail</a>
                <br><br>
                <p>Se você não criou esta conta, pode ignorar este e-mail.</p>
            </div>";

        await emailClient.SendAsync(
            WaitUntil.Completed,
            senderAddress: senderAddress,
            recipientAddress: emailDestino,
            subject: "Caddie Research - Confirme seu E-mail",
            htmlContent: htmlContent
        );
    }
    
    public async Task EnviarEmailRecuperacaoAsync(string emailDestino, string nomeDestino, string codigoRecuperacao)
    {
        var connectionString = _configuration["AzureEmail:ConnectionString"];
        var senderAddress = _configuration["AzureEmail:Sender"];

        var emailClient = new EmailClient(connectionString);

        var htmlContent = $@"
            <div style='font-family: Arial, sans-serif; color: #333; padding: 20px;'>
                <h2>Olá, {nomeDestino}!</h2>
                <p>Recebemos um pedido para redefinir a senha da sua conta no Caddie Research.</p>
                <p>Seu código de verificação é:</p>
                
                <div style='font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #00bcd4; margin: 20px 0; padding: 10px; background-color: #e8f9fb; display: inline-block; border-radius: 8px;'>
                    {codigoRecuperacao}
                </div>
                
                <p>Este código é válido por <strong>15 minutos</strong>.</p>
                <br>
                <p style='font-size: 12px; color: #888;'>
                    Se você não solicitou esta alteração, por favor ignore este e-mail. Nenhuma mudança será feita na sua conta.
                </p>
            </div>";

        await emailClient.SendAsync(
            WaitUntil.Completed,
            senderAddress: senderAddress,
            recipientAddress: emailDestino,
            subject: "Caddie Research - Código de Recuperação de Senha",
            htmlContent: htmlContent
        );
    }

    public async Task EnviarHistoricoChatAsync(string emailDestino, string nomeDestino, string assunto, List<(string Remetente, bool EhGestor, string Conteudo, DateTime DataEnvio)> mensagens)
    {
        var connectionString = _configuration["AzureEmail:ConnectionString"];
        var senderAddress    = _configuration["AzureEmail:Sender"];

        if (string.IsNullOrEmpty(connectionString) || string.IsNullOrEmpty(senderAddress))
            return; // Não configurado localmente — ignora silenciosamente

        var emailClient = new EmailClient(connectionString);

        var linhasMensagens = string.Join("", mensagens.Select(m =>
        {
            var cor       = m.EhGestor ? "#1a2f45" : "#003d5c";
            var remetente = m.Remetente; // Já vem formatado ("Analista Gustavo" ou nome do cliente)
            var justify   = m.EhGestor ? "flex-start" : "flex-end";
            return $@"
                <div style='display:flex; justify-content:{justify}; margin-bottom:12px;'>
                    <div style='max-width:75%; background:{cor}; padding:10px 14px; border-radius:12px;'>
                        <div style='font-size:11px; color:#00B4D8; font-weight:bold; margin-bottom:4px;'>{remetente}</div>
                        <div style='color:#e0f0f8; font-size:14px;'>{m.Conteudo}</div>
                        <div style='font-size:10px; color:#7a90a8; margin-top:4px; text-align:right;'>{m.DataEnvio.ToLocalTime():dd/MM/yyyy HH:mm}</div>
                    </div>
                </div>";
        }));

        var htmlContent = $@"
            <div style='font-family:Inter,Arial,sans-serif; background:#0a121e; padding:32px; border-radius:12px;'>
                <div style='text-align:center; margin-bottom:24px;'>
                    <h2 style='color:#00B4D8; margin:0;'>Caddie Research</h2>
                    <p style='color:#7a90a8; margin:4px 0 0;'>Histórico de atendimento</p>
                </div>
                <div style='background:#0d1520; border-radius:10px; padding:16px; margin-bottom:24px;'>
                    <p style='color:#c9d1d9; margin:0;'>Olá <strong style='color:#fff;'>{nomeDestino}</strong>,</p>
                    <p style='color:#7a90a8; margin:8px 0 0;'>Segue o histórico do seu atendimento sobre <strong style='color:#00B4D8;'>{assunto}</strong>.</p>
                </div>
                <div style='background:#0d1520; border-radius:10px; padding:20px;'>
                    {linhasMensagens}
                </div>
                <p style='color:#4a6070; font-size:12px; text-align:center; margin-top:24px;'>
                    Este é um e-mail automático do Caddie Research. Por favor, não responda.
                </p>
            </div>";

        await emailClient.SendAsync(
            WaitUntil.Completed,
            senderAddress: senderAddress,
            recipientAddress: emailDestino,
            subject: $"Caddie Research - Histórico do seu atendimento: {assunto}",
            htmlContent: htmlContent
        );
    }
}