using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace CaddieResearch.Models 
{
    public class Carteira
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Nome { get; set; } 

        [Required]
        public int NivelAcesso { get; set; } 
        public string Rentabilidade { get; set; } = "0,00%";

        public ICollection<Ativo> Ativos { get; set; } = new List<Ativo>();
    }
}