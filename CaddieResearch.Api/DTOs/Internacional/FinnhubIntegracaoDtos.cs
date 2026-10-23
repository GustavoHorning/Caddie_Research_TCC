using System.Text.Json.Serialization;

namespace CaddieResearch.Api.DTOs.Internacional;

public class FinnhubQuote
{
    public decimal? c { get; set; }  
    public decimal? dp { get; set; } 
}

public class FinnhubProfile
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty; 

    [JsonPropertyName("logo")]
    public string Logo { get; set; } = string.Empty; 
}

public class AwesomeApiCurrency
{
    public string ask { get; set; } = string.Empty;
}