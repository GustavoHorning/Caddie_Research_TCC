using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using CaddieResearch.Models;

namespace CaddieResearch.Models {
    public class Ativo
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(10)]
        public string Ticker { get; set; } 

        [Required]
        [MaxLength(100)]
        public string NomeEmpresa { get; set; } 

        [Column(TypeName = "decimal(18,2)")]
        public decimal PrecoEntrada { get; set; } 

        [Column(TypeName = "decimal(18,2)")]
        public decimal PrecoTeto { get; set; } 

        [Column(TypeName = "decimal(18,2)")]
        public decimal PrecoAtual { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal DyEsperado { get; set; }

        [Required]
        [MaxLength(20)]
        public string Vies { get; set; } 

        public DateTime DataInclusao { get; set; } = DateTime.UtcNow;

        [Required]
        public int CarteiraId { get; set; }
        [System.Text.Json.Serialization.JsonIgnore]
        public Carteira? Carteira { get; set; }
    }
}