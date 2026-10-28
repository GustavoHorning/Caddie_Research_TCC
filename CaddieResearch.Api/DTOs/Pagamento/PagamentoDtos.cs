namespace CaddieResearch.Api.DTOs.Pagamento;

/// <summary>
/// Dados enviados pelo frontend para gerar o link de pagamento.
/// </summary>
public class PagamentoDtos
{
    /// <example>Premium</example>
    public string Plano { get; set; } = string.Empty;
    
    /// <example>pix</example>
    public string Metodo { get; set; } = string.Empty;
    
    /// <example>42</example>
    public int UsuarioId { get; set; }
}

/// <summary>
/// Resposta com a URL segura de checkout do gateway.
/// </summary>
public class CheckoutResponseDto
{
    /// <example>https://abacatepay.com/checkout/req_322yu06yqStXhpKax</example>
    public string Url { get; set; } = string.Empty;
}

/// <summary>
/// Resposta da verificação periódica de status de pagamento.
/// </summary>
public class VerificarStatusResponseDto
{
    /// <example>pago</example>
    public string Status { get; set; } = string.Empty;
    
    /// <example>eyJhbGciOiJIUzI1NiIsInR5cCI6...</example>
    public string? Token { get; set; }
}

/// <summary>
/// Estrutura padrão de erro de gateway.
/// </summary>
public class PagamentoErrorDto
{
    /// <example>Falha no gateway</example>
    public string Erro { get; set; } = string.Empty;
    
    /// <example>A API Key informada é inválida.</example>
    public string? Detalhe { get; set; }
}