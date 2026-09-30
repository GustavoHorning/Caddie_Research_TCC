using System;

namespace CaddieResearch.Api.Models
{
    public class Notificacao
    {
        public int Id { get; set; }
        
        public int? UsuarioId { get; set; } 
        
        public string Titulo { get; set; } = string.Empty;
        public string Mensagem { get; set; } = string.Empty;
        
        public string Tipo { get; set; } = "Info"; 
        
        public string? LinkDestino { get; set; } 
        
        public bool Lida { get; set; } = false;
        
        public DateTime DataCriacao { get; set; } = DateTime.UtcNow;
    }
}