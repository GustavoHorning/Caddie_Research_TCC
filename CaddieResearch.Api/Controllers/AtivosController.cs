using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CaddieResearch.Models;
using CaddieResearch.Api.Data;
using System.Threading.Tasks;
using System;
using CaddieResearch.Api.Services; 
using Microsoft.AspNetCore.SignalR;
using CaddieResearch.Api.Hubs;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Collections.Generic;
using CaddieResearch.Api.Models;

namespace CaddieResearch.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AtivosController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly AcoesService _acoesService;
        private readonly IHubContext<NotificationHub> _hubContext; 

        public AtivosController(AppDbContext context, AcoesService acoesService, IHubContext<NotificationHub> hubContext)
        {
            _context = context;
            _acoesService = acoesService;
            _hubContext = hubContext; 
        }
        
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletarAtivo(int id)
        {
            var ativo = await _context.Ativos.FindAsync(id);
    
            if (ativo == null)
            {
                return NotFound(new { mensagem = "Ativo não encontrado." });
            }

            int carteiraId = ativo.CarteiraId;
            string ticker = ativo.Ticker;

            _context.Ativos.Remove(ativo);
            await _context.SaveChangesAsync();

            await DispararNotificacaoCarteiraAsync(
                carteiraId, 
                $"⚠️ Ativo Removido da Carteira", 
                $"O ativo {ticker} encerrou sua tese e foi removido da carteira pelo Gestor."
            );

            return Ok(new { mensagem = "Ativo removido com sucesso!" });
        }

        [HttpPost]
        [Authorize(Roles = "Gestor")] 
        public async Task<IActionResult> CriarAtivo([FromBody] Ativo novoAtivo)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            
            var jaExiste = _context.Ativos.Any(a => a.Ticker == novoAtivo.Ticker && a.CarteiraId == novoAtivo.CarteiraId);
            if (jaExiste) return BadRequest(new { mensagem = $"O ativo {novoAtivo.Ticker} já existe nesta carteira." });

            if (string.IsNullOrWhiteSpace(novoAtivo.NomeEmpresa))
            {
                var dadosAtivo = await _acoesService.ObterCotacaoAsync(novoAtivo.Ticker);
                novoAtivo.NomeEmpresa = (dadosAtivo != null && !string.IsNullOrWhiteSpace(dadosAtivo.Name)) 
                                        ? dadosAtivo.Name : novoAtivo.Ticker;
            }
            
            _context.Ativos.Add(novoAtivo);
            await _context.SaveChangesAsync();

            await DispararNotificacaoCarteiraAsync(
                novoAtivo.CarteiraId, 
                $"🚨 Novo Ativo Adicionado", 
                $"O Gestor adicionou {novoAtivo.Ticker} na carteira. Confira a tese de investimentos!"
            );

            return Ok(new { mensagem = "Recomendação publicada com sucesso!", ativo = novoAtivo });
        }
        
        [HttpPut("{id}")]
        [Authorize] 
        public async Task<IActionResult> AtualizarAtivo(int id, [FromBody] Ativo ativoAtualizado)
        {
            var role = User.FindFirst("http://schemas.microsoft.com/ws/2008/06/identity/claims/role")?.Value 
                       ?? User.FindFirst("Role")?.Value;
               
            if (role != "Gestor") return Forbid(); 
            
            var conflito = _context.Ativos.Any(a => a.Ticker == ativoAtualizado.Ticker && a.CarteiraId == ativoAtualizado.CarteiraId && a.Id != id);
            if (conflito) return BadRequest(new { mensagem = "Já existe outro ativo com este ticker nesta carteira." });

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

            await DispararNotificacaoCarteiraAsync(
                ativoAtualizado.CarteiraId, 
                $"🔄 Recomendação Atualizada", 
                $"O Gestor alterou os parâmetros e o racional do ativo {ativoAtualizado.Ticker}. Confira as mudanças."
            );

            return Ok(ativoBanco);
        }

        private async Task DispararNotificacaoCarteiraAsync(int carteiraId, string titulo, string mensagem)
        {
            try
            {
                var carteira = await _context.Carteiras.FindAsync(carteiraId);
                if (carteira == null) return;

                TimeZoneInfo fusoBrasilia;
                try 
                {
                    fusoBrasilia = TimeZoneInfo.FindSystemTimeZoneById("E. South America Standard Time");
                } 
                catch 
                {
                    fusoBrasilia = TimeZoneInfo.FindSystemTimeZoneById("America/Sao_Paulo");
                }
                DateTime horaBrasilia = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, fusoBrasilia);

                var planosPermitidos = new List<string>();

                if (carteira.NivelAcesso <= 1) planosPermitidos.AddRange(new[] { "Basic", "Premium", "Black" });
                else if (carteira.NivelAcesso <= 2) planosPermitidos.AddRange(new[] { "Premium", "Black" });
                else planosPermitidos.Add("Black");

                var usuariosAlvoIds = await _context.Usuarios
                    .Where(u => u.TipoPerfil == "Gestor" || 
                                _context.Assinaturas.Any(a => a.UsuarioId == u.Id 
                                                           && a.Status == "Ativo" 
                                                           && planosPermitidos.Contains(a.PlanoNome)))
                    .Select(u => u.Id)
                    .Distinct()
                    .ToListAsync();

                var novasNotificacoes = new List<Notificacao>();

                foreach (var usuarioId in usuariosAlvoIds)
                {
                    novasNotificacoes.Add(new Notificacao
                    {
                        UsuarioId = usuarioId,
                        Titulo = titulo,
                        Mensagem = mensagem,
                        Tipo = "Trade",
                        LinkDestino = $"/carteiras/{carteira.Id}", 
                        Lida = false,
                        DataCriacao = horaBrasilia 
                    });
                }

                if (novasNotificacoes.Any())
                {
                    _context.Notificacoes.AddRange(novasNotificacoes);
                    await _context.SaveChangesAsync();

                    foreach (var notif in novasNotificacoes)
                    {
                        await _hubContext.Clients.Group($"User_{notif.UsuarioId}")
                                         .SendAsync("ReceberNotificacao", notif);
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erro ao disparar notificação centralizada: {ex.Message}");
            }
        }
    }
}