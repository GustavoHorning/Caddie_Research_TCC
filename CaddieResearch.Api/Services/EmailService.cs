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

        // Envia o e-mail diretamente pela infraestrutura corporativa do Azure
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
}