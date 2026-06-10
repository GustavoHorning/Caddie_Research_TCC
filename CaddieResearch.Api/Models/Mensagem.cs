using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CaddieResearch.Api.Models;

public class Mensagem
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int ConversaId { get; set; }

    [ForeignKey("ConversaId")]
    public Conversa? Conversa { get; set; }

    [Required]
    public int RemetenteId { get; set; }

    [ForeignKey("RemetenteId")]
    public Usuario? Remetente { get; set; }

    [Required]
    [MaxLength(2000)]
    public string Conteudo { get; set; } = string.Empty;

    public bool EhGestor { get; set; } = false;

    public bool Lida { get; set; } = false;

    public DateTime DataEnvio { get; set; } = DateTime.UtcNow;
}
