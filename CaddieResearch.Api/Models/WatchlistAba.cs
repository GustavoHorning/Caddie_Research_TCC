using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace CaddieResearch.Api.Models;

public class WatchlistAba
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
    public string Nome { get; set; } = string.Empty;

    public DateTime DataCriacao { get; set; } = DateTime.UtcNow;

    public ICollection<WatchlistAbaFavorito> Itens { get; set; } = new List<WatchlistAbaFavorito>();
}

// Tabela de ligação: um favorito pode estar em várias abas, e uma aba pode ter vários favoritos
public class WatchlistAbaFavorito
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int WatchlistAbaId { get; set; }

    [JsonIgnore]
    [ForeignKey("WatchlistAbaId")]
    public WatchlistAba? WatchlistAba { get; set; }

    [Required]
    public int FavoritoId { get; set; }

    [ForeignKey("FavoritoId")]
    public Favorito? Favorito { get; set; }
}