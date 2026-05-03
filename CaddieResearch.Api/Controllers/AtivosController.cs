using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CaddieResearch.Models;
using CaddieResearch.Api.Data;

namespace CaddieResearch.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AtivosController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AtivosController(AppDbContext context)
        {
            _context = context;
        }
        
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletarAtivo(int id)
        {
            var ativo = await _context.Ativos.FindAsync(id);
    
            if (ativo == null)
            {
                return NotFound(new { mensagem = "Ativo não encontrado." });
            }

            _context.Ativos.Remove(ativo);
            await _context.SaveChangesAsync();

            return Ok(new { mensagem = "Ativo removido com sucesso!" });
        }

        [HttpPost]
        [Authorize(Roles = "Gestor")] 
        public async Task<IActionResult> CriarAtivo([FromBody] Ativo novoAtivo)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            _context.Ativos.Add(novoAtivo);
            await _context.SaveChangesAsync();

            return Ok(new { mensagem = "Recomendação publicada com sucesso!", ativo = novoAtivo });
        }
        
        [HttpPut("{id}")]
        [Authorize] 
        public async Task<IActionResult> AtualizarAtivo(int id, [FromBody] Ativo ativoAtualizado)
        {
            var role = User.FindFirst("http://schemas.microsoft.com/ws/2008/06/identity/claims/role")?.Value 
                       ?? User.FindFirst("Role")?.Value;
               
            if (role != "Gestor") return Forbid(); 

            var ativoBanco = await _context.Ativos.FindAsync(id);
            if (ativoBanco == null) return NotFound();

            ativoBanco.PrecoTeto = ativoAtualizado.PrecoTeto;
            ativoBanco.Vies = ativoAtualizado.Vies;
    

            await _context.SaveChangesAsync();

            return Ok(ativoBanco);
        }
    }
}