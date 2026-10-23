namespace CaddieResearch.Api.DTOs.Auth;

public class LoginGoogleRequest
{
    public string Token { get; set; } = string.Empty;
}

public class GoogleUserInfo
{
    public string email { get; set; } = string.Empty;
    public string name { get; set; } = string.Empty;
    public bool email_verified { get; set; }
}

public class LoginMicrosoftRequest
{
    public string Token { get; set; } = string.Empty;
}

public class MicrosoftUserInfo
{
    public string displayName { get; set; } = string.Empty;
    public string mail { get; set; } = string.Empty;
    public string userPrincipalName { get; set; } = string.Empty;
}