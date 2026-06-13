using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using CaddieResearch.Models;

namespace CaddieResearch.Api.Models;

public class Relatorio
{
    public int Id { get; set; }
    
    [Required]
    public string Titulo { get; set; } = string.Empty;
    
    [Required]
    public string Assunto { get; set; } = string.Empty;
    
    public string ConteudoTexto { get; set; } = string.Empty;
    
    public string? ArquivoPdfUrl { get; set; }
    public string? ConteudoPdfTexto { get; set; }
    
    [Required]
    public int CarteiraId { get; set; } 
    
    [ForeignKey("CarteiraId")]
    public Carteira? Carteira { get; set; } 
    
    public DateTime DataPublicacao { get; set; } = DateTime.UtcNow;
}