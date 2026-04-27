using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace CaddieResearch.Api.Models;

public class Assinatura
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int UsuarioId { get; set; }

    [JsonIgnore]
    [ForeignKey("UsuarioId")]
    public Usuario? Usuario { get; set; }

    [Required]
    [MaxLength(50)]
    public string PlanoNome { get; set; } = string.Empty; 

    [Required]
    public decimal ValorPago { get; set; }

    public DateTime DataInicio { get; set; } = DateTime.UtcNow;
    
    public DateTime DataVencimento { get; set; } = DateTime.UtcNow.AddMonths(1);

    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = "Ativo"; 
}