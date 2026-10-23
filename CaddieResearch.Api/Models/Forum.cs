using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;


namespace CaddieResearch.Api.Models;

public static class ForumStatus
{
    public const string Pendente = "Pendente";
    public const string Publicado = "Publicado";
    public const string Recusado = "Recusado";
}

public class ForumTopico
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int AutorId { get; set; }

    
    [ForeignKey("AutorId")]
    public Usuario? Autor { get; set; }

    [Required]
    [MaxLength(150)]
    public string Titulo { get; set; } = string.Empty;

    [Required]
    public string Conteudo { get; set; } = string.Empty;

    [Required]
    [MaxLength(30)]
    public string Categoria { get; set; } = string.Empty;

    
    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = ForumStatus.Pendente;

    [MaxLength(500)]
    public string? MotivoRecusa { get; set; }

    public DateTime DataCriacao { get; set; } = DateTime.UtcNow;

    public DateTime? DataModeracao { get; set; }

    public ICollection<ForumResposta> Respostas { get; set; } = new List<ForumResposta>();

    public ICollection<ForumCurtida> Curtidas { get; set; } = new List<ForumCurtida>();
}

public class ForumResposta
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int TopicoId { get; set; }

    
    [ForeignKey("TopicoId")]
    public ForumTopico? Topico { get; set; }

    [Required]
    public int AutorId { get; set; }

    
    [ForeignKey("AutorId")]
    public Usuario? Autor { get; set; }

    
    public string Conteudo { get; set; } = string.Empty;

    
    [MaxLength(500)]
    public string? AudioUrl { get; set; }

    public DateTime DataCriacao { get; set; } = DateTime.UtcNow;

    public ICollection<ForumRespostaCurtida> Curtidas { get; set; } = new List<ForumRespostaCurtida>();

    public ICollection<ForumRespostaAnexo> Anexos { get; set; } = new List<ForumRespostaAnexo>();
}

public class ForumRespostaAnexo
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int RespostaId { get; set; }

    [ForeignKey("RespostaId")]
    public ForumResposta? Resposta { get; set; }

    [Required]
    [MaxLength(255)]
    public string NomeArquivo { get; set; } = string.Empty;

    [Required]
    [MaxLength(500)]
    public string Url { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string ContentType { get; set; } = string.Empty;

    public long TamanhoBytes { get; set; }
}

public class ForumCurtida
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int TopicoId { get; set; }

    [ForeignKey("TopicoId")]
    public ForumTopico? Topico { get; set; }

    [Required]
    public int UsuarioId { get; set; }

    public DateTime DataCriacao { get; set; } = DateTime.UtcNow;
}

public class ForumRespostaCurtida
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int RespostaId { get; set; }

    [ForeignKey("RespostaId")]
    public ForumResposta? Resposta { get; set; }

    [Required]
    public int UsuarioId { get; set; }

    public DateTime DataCriacao { get; set; } = DateTime.UtcNow;
}
