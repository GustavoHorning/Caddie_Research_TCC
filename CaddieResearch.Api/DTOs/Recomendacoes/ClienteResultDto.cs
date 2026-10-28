namespace CaddieResearch.Api.DTOs.Recomendacoes;

public class ClienteResultDto
{
    /// <example>42</example>
    public int Id { get; set; }
    /// <example>João da Silva</example>
    public string Nome { get; set; } = string.Empty;
    /// <example>joao@email.com</example>
    public string Email { get; set; } = string.Empty;
}