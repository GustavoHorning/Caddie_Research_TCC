using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CaddieResearch.Models;
using CaddieResearch.Api.Data;
using System.Net.Http;
using System.Threading.Tasks;
using System;
using CaddieResearch.Api.Services; 

namespace CaddieResearch.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AtivosController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly AcoesService _acoesService;

        public AtivosController(AppDbContext context, AcoesService acoesService)
        {
            _context = context;
            _acoesService = acoesService;
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

            if (string.IsNullOrWhiteSpace(novoAtivo.NomeEmpresa))
            {
                var dadosAtivo = await _acoesService.ObterCotacaoAsync(novoAtivo.Ticker);
                
                if (dadosAtivo != null && !string.IsNullOrWhiteSpace(dadosAtivo.Name))
                {
                    novoAtivo.NomeEmpresa = dadosAtivo.Name;
                }
                else
                {
                    novoAtivo.NomeEmpresa = novoAtivo.Ticker; 
                }
            }
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

            ativoBanco.Ticker = ativoAtualizado.Ticker;
            ativoBanco.PrecoTeto = ativoAtualizado.PrecoTeto;
            ativoBanco.Vies = ativoAtualizado.Vies;
            ativoBanco.NomeEmpresa = ativoAtualizado.NomeEmpresa; 
            ativoBanco.Rentabilidade = ativoAtualizado.Rentabilidade;
            ativoBanco.Vencimento = ativoAtualizado.Vencimento;
            ativoBanco.Liquidez = ativoAtualizado.Liquidez;

            ativoBanco.DataEntrada = ativoAtualizado.DataEntrada;
            ativoBanco.Categoria = ativoAtualizado.Categoria;

            await _context.SaveChangesAsync();

            return Ok(ativoBanco);
        }
    }
}