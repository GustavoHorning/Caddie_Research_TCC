using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CaddieResearch.Api.Data;
using System.Security.Claims;
using CaddieResearch.Api.Services; 
using Microsoft.EntityFrameworkCore;
using CaddieResearch.Api.Models;
using CaddieResearch.Api.DTOs.Ativos;
using CaddieResearch.Api.Interfaces;
using CaddieResearch.Models; 

namespace CaddieResearch.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AtivosController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly AcoesService _acoesService;
        private readonly INotificacaoService _notificacaoService; 

        public AtivosController(AppDbContext context, AcoesService acoesService, INotificacaoService notificacaoService)
        {
            _context = context;
            _acoesService = acoesService;
            _notificacaoService = notificacaoService; 
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Gestor")]
        public async Task<IActionResult> DeletarAtivo(int id)
        {
            var ativo = await _context.Ativos.FindAsync(id);
    
            if (ativo == null)
                return NotFound(new { mensagem = "Ativo não encontrado." });

            int carteiraId = ativo.CarteiraId;
            string ticker = ativo.Ticker;

            var gestorIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(gestorIdStr, out int gestorId))
            {
                var log = new HistoricoRecomendacaoCarteira
                {
                    CarteiraId = ativo.CarteiraId,
                    GestorId = gestorId,
                    Ticker = ativo.Ticker,
                    NomeAtivo = ativo.NomeEmpresa ?? ativo.Ticker,
                    Acao = "Excluiu",
                    Vies = ativo.Vies,
                    PrecoAlvo = ativo.PrecoTeto ?? 0,
                    Justificativa = "Ativo removido da carteira pelo gestor.",
                    DataRecomendacao = DateTime.UtcNow
                };
                _context.HistoricoRecomendacoesCarteiras.Add(log);
            }

            _context.Ativos.Remove(ativo);
            await _context.SaveChangesAsync();

            await _notificacaoService.DispararNotificacaoCarteiraAsync(
                carteiraId, 
                "⚠️ Ativo Removido da Carteira", 
                $"O ativo {ticker} encerrou sua tese e foi removido da carteira pelo Gestor."
            );

            return Ok(new { mensagem = "Ativo removido com sucesso!" });
        }

        [HttpPost]
        [Authorize(Roles = "Gestor")] 
        public async Task<IActionResult> CriarAtivo([FromBody] AtivoRequestDto dto) 
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            
            var jaExiste = await _context.Ativos.AnyAsync(a => a.Ticker == dto.Ticker && a.CarteiraId == dto.CarteiraId);
            if (jaExiste) return BadRequest(new { mensagem = $"O ativo {dto.Ticker} já existe nesta carteira." });

            var novoAtivo = new Ativo
            {
                CarteiraId = dto.CarteiraId,
                Ticker = dto.Ticker,
                NomeEmpresa = dto.NomeEmpresa,
                PrecoTeto = dto.PrecoTeto,
                Vies = dto.Vies,
                Rentabilidade = dto.Rentabilidade,
                Vencimento = dto.Vencimento,
                Liquidez = dto.Liquidez,
                DataEntrada = dto.DataEntrada ?? DateTime.UtcNow,
                Categoria = dto.Categoria
            };

            if (string.IsNullOrWhiteSpace(novoAtivo.NomeEmpresa))
            {
                var dadosAtivo = await _acoesService.ObterCotacaoAsync(novoAtivo.Ticker);
                novoAtivo.NomeEmpresa = (dadosAtivo != null && !string.IsNullOrWhiteSpace(dadosAtivo.Name)) 
                                        ? dadosAtivo.Name : novoAtivo.Ticker;
            }
            
            _context.Ativos.Add(novoAtivo);

            var gestorIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(gestorIdStr, out int gestorId))
            {
                var log = new HistoricoRecomendacaoCarteira
                {
                    CarteiraId = novoAtivo.CarteiraId,
                    GestorId = gestorId,
                    Ticker = novoAtivo.Ticker,
                    NomeAtivo = novoAtivo.NomeEmpresa ?? novoAtivo.Ticker,
                    Acao = "Adicionou",
                    Vies = novoAtivo.Vies,
                    PrecoAlvo = novoAtivo.PrecoTeto ?? 0,
                    Justificativa = "Inclusão inicial na carteira.",
                    DataRecomendacao = DateTime.UtcNow
                };
                _context.HistoricoRecomendacoesCarteiras.Add(log);
            }

            await _context.SaveChangesAsync();

            await _notificacaoService.DispararNotificacaoCarteiraAsync(
                novoAtivo.CarteiraId, 
                "🚨 Novo Ativo Adicionado", 
                $"O Gestor adicionou {novoAtivo.Ticker} na carteira. Confira a tese de investimentos!"
            );

            return Ok(new { mensagem = "Recomendação publicada com sucesso!", ativo = novoAtivo });
        }
        
        [HttpPut("{id}")]
        [Authorize(Roles = "Gestor")] 
        public async Task<IActionResult> AtualizarAtivo(int id, [FromBody] AtivoRequestDto dto) 
        {
            var conflito = await _context.Ativos.AnyAsync(a => a.Ticker == dto.Ticker && a.CarteiraId == dto.CarteiraId && a.Id != id);
            if (conflito) return BadRequest(new { mensagem = "Já existe outro ativo com este ticker nesta carteira." });

            var ativoBanco = await _context.Ativos.FindAsync(id);
            if (ativoBanco == null) return NotFound();

            if (ativoBanco.Vies != dto.Vies || ativoBanco.PrecoTeto != dto.PrecoTeto)
            {
                var gestorIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (int.TryParse(gestorIdStr, out int gestorId))
                {
                    var log = new HistoricoRecomendacaoCarteira
                    {
                        CarteiraId = dto.CarteiraId,
                        GestorId = gestorId,
                        Ticker = dto.Ticker,
                        NomeAtivo = dto.NomeEmpresa ?? dto.Ticker,
                        Acao = "Atualizou",
                        Vies = dto.Vies,
                        PrecoAlvo = dto.PrecoTeto ?? 0,
                        Justificativa = "Atualização estratégica de viés ou preço teto.",
                        DataRecomendacao = DateTime.UtcNow
                    };
                    _context.HistoricoRecomendacoesCarteiras.Add(log);
                }
            }

            ativoBanco.Ticker = dto.Ticker;
            ativoBanco.PrecoTeto = dto.PrecoTeto;
            ativoBanco.Vies = dto.Vies;
            ativoBanco.NomeEmpresa = dto.NomeEmpresa; 
            ativoBanco.Rentabilidade = dto.Rentabilidade;
            ativoBanco.Vencimento = dto.Vencimento;
            ativoBanco.Liquidez = dto.Liquidez;
            ativoBanco.DataEntrada = dto.DataEntrada;
            ativoBanco.Categoria = dto.Categoria;

            await _context.SaveChangesAsync();

            await _notificacaoService.DispararNotificacaoCarteiraAsync(
                dto.CarteiraId, 
                "🔄 Recomendação Atualizada", 
                $"O Gestor alterou os parâmetros e o racional do ativo {dto.Ticker}. Confira as mudanças."
            );

            return Ok(ativoBanco);
        }
    }
}