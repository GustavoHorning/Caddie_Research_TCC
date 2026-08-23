using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using CaddieResearch.Api.Models;
using CaddieResearch.Models;

namespace CaddieResearch.Api.Models;

public class RelatorioRevisado
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int UsuarioId { get; set; }

    [ForeignKey("UsuarioId")]
    public Usuario? Usuario { get; set; }

    [Required]
    public int RelatorioId { get; set; }

    [ForeignKey("RelatorioId")]
    public Relatorio? Relatorio { get; set; }

    public DateTime DataRevisado { get; set; } = DateTime.UtcNow;
}
