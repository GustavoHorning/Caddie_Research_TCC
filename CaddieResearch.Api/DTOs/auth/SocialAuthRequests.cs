namespace CaddieResearch.Api.DTOs.Auth;

/// <summary>
/// Requisição para autenticação via Google.
/// </summary>
public class LoginGoogleRequest
{
    /// <example>ya29.a0AfB_byC...</example>
    public string Token { get; set; } = string.Empty;
}

public class GoogleUserInfo
{
    public string email { get; set; } = string.Empty;
    public string name { get; set; } = string.Empty;
    public bool email_verified { get; set; }
}

/// <summary>
/// Requisição para autenticação via Microsoft.
/// </summary>
public class LoginMicrosoftRequest
{
    /// <example>EwBQA8l6BAAU...</example>
    public string Token { get; set; } = string.Empty;
}

public class MicrosoftUserInfo
{
    public string displayName { get; set; } = string.Empty;
    public string mail { get; set; } = string.Empty;
    public string userPrincipalName { get; set; } = string.Empty;
}