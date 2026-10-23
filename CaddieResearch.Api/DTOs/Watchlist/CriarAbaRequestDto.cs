using System.ComponentModel.DataAnnotations;

namespace CaddieResearch.Api.DTOs.Watchlist;

public class CriarAbaRequestDto
{
    [Required(ErrorMessage = "O nome da aba é obrigatório.")]
    [MaxLength(50, ErrorMessage = "O nome da aba deve ter até 50 caracteres.")]
    public string Nome { get; set; } = string.Empty;
}