using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace CaddieResearch.Api.Models;

public class MorningCall
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int GestorId { get; set; }

    [JsonIgnore]
    [ForeignKey("GestorId")]
    public Usuario? Gestor { get; set; }

    [Required]
    [MaxLength(150)]
    public string Titulo { get; set; } = string.Empty;

    [Required]
    public DateTime Data { get; set; }

    public DateTime DataCriacao { get; set; } = DateTime.UtcNow;

    public ICollection<MorningCallTopico> Topicos { get; set; } = new List<MorningCallTopico>();
}

public class MorningCallTopico
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int MorningCallId { get; set; }

    [JsonIgnore]
    [ForeignKey("MorningCallId")]
    public MorningCall? MorningCall { get; set; }

    [Required]
    [MaxLength(200)]
    public string Titulo { get; set; } = string.Empty;

    [Required]
    [MaxLength(2000)]
    public string Texto { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Link { get; set; }

    [MaxLength(500)]
    public string? ImagemUrl { get; set; }

    // Define a ordem de exibição dos tópicos dentro do Morning Call
    public int Ordem { get; set; } = 0;
}