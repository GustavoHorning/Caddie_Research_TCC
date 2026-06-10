using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CaddieResearch.Api.Models;

public class Conversa
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int UsuarioId { get; set; }

    [ForeignKey("UsuarioId")]
    public Usuario? Usuario { get; set; }

    [Required]
    [MaxLength(50)]
    public string Assunto { get; set; } = string.Empty; // "Investimentos" ou "Conta"

    [MaxLength(20)]
    public string Status { get; set; } = "Aberta"; // "Aberta" ou "Fechada"

    public DateTime DataAbertura { get; set; } = DateTime.UtcNow;

    public ICollection<Mensagem> Mensagens { get; set; } = new List<Mensagem>();
}
