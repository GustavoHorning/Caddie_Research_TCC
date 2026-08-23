using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CaddieResearch.Api.Models;

public class Portfolio
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int UsuarioId { get; set; }

    [ForeignKey("UsuarioId")]
    public Usuario? Usuario { get; set; }

    [Required]
    [MaxLength(100)]
    public string Nome { get; set; } = "Portfólio Inicial";

    public DateTime DataInicio { get; set; } = DateTime.UtcNow;

    public ICollection<Posicao>? Posicoes { get; set; }
}
