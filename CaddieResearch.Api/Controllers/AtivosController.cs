using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CaddieResearch.Models;
using CaddieResearch.Api.Data;
using System.Security.Claims;
using CaddieResearch.Api.Services; 
using Microsoft.AspNetCore.SignalR;
using CaddieResearch.Api.Hubs;
using Microsoft.EntityFrameworkCore;
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

        /// <summary>
        /// Exclui um ativo de uma carteira recomendada (Acesso Exclusivo Gestor).
        /// </summary>
        /// <remarks>
        /// Remove um ativo da carteira informada, gera um log de exclusão e dispara uma notificação push para todos os clientes elegíveis informando o encerramento da tese.
        /// </remarks>
        /// <param name="id">O ID do ativo na carteira.</param>
        /// <response code="200">Ativo removido e notificação enviada.</response>
        /// <response code="404">Ativo não encontrado na base de dados.</response>
        [HttpDelete("{id}")]
        [Authorize(Roles = "Gestor")]
        [ProducesResponseType(200)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> DeletarAtivo(int id)
        {
            var ativo = await _context.Ativos.FindAsync(id);
    
            if (ativo == null)
            {
                return NotFound(new { mensagem = "Ativo não encontrado." });
            }

            int carteiraId = ativo.CarteiraId;
            string ticker = ativo.Ticker;

            var gestorIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(gestorIdStr, out int gestorId))
            {
                var log = new CaddieResearch.Api.Models.HistoricoRecomendacaoCarteira
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

            await DispararNotificacaoCarteiraAsync(
                carteiraId, 
                $"⚠️ Ativo Removido da Carteira", 
                $"O ativo {ticker} encerrou sua tese e foi removido da carteira pelo Gestor."
            );

            return Ok(new { mensagem = "Ativo removido com sucesso!" });
        }

        /// <summary>
        /// Cria uma nova recomendação de ativo em uma carteira (Acesso Exclusivo Gestor).
        /// </summary>
        /// <remarks>
        /// Valida a duplicidade na carteira, busca o nome da empresa pela API caso não informado, grava a entrada no banco, salva o log de auditoria e dispara notificação em tempo real (SignalR).
        /// </remarks>
        /// <response code="200">Ativo publicado e clientes notificados.</response>
        /// <response code="400">Falha de validação ou o ativo já existe na carteira selecionada.</response>
        [HttpPost]
        [Authorize(Roles = "Gestor")] 
        [ProducesResponseType(200)]
        [ProducesResponseType(400)]
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

            var gestorIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(gestorIdStr, out int gestorId))
            {
                var log = new CaddieResearch.Api.Models.HistoricoRecomendacaoCarteira
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

            await DispararNotificacaoCarteiraAsync(
                novoAtivo.CarteiraId, 
                $"🚨 Novo Ativo Adicionado", 
                $"O Gestor adicionou {novoAtivo.Ticker} na carteira. Confira a tese de investimentos!"
            );

            return Ok(new { mensagem = "Recomendação publicada com sucesso!", ativo = novoAtivo });
        }
        
        /// <summary>
        /// Atualiza os parâmetros de uma recomendação ativa na carteira (Acesso Exclusivo Gestor).
        /// </summary>
        /// <remarks>
        /// Caso o viés ou o preço-teto sejam modificados, o sistema automaticamente registra o log de alteração de rota para os clientes e dispara notificações.
        /// </remarks>
        /// <param name="id">ID primário do ativo no banco.</param>
        /// <response code="200">Recomendação atualizada com sucesso.</response>
        /// <response code="400">Falha de validação ou conflito de ticker.</response>
        /// <response code="404">Ativo não encontrado.</response>
        [HttpPut("{id}")]
        [Authorize(Roles = "Gestor")]
        [ProducesResponseType(200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> AtualizarAtivo(int id, [FromBody] Ativo ativoAtualizado)
        {
            var conflito = _context.Ativos.Any(a => a.Ticker == ativoAtualizado.Ticker && a.CarteiraId == ativoAtualizado.CarteiraId && a.Id != id);
            if (conflito) return BadRequest(new { mensagem = "Já existe outro ativo com este ticker nesta carteira." });

            var ativoBanco = await _context.Ativos.FindAsync(id);
            if (ativoBanco == null) return NotFound();

            if (ativoBanco.Vies != ativoAtualizado.Vies || ativoBanco.PrecoTeto != ativoAtualizado.PrecoTeto)
            {
                var gestorIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (int.TryParse(gestorIdStr, out int gestorId))
                {
                    var log = new CaddieResearch.Api.Models.HistoricoRecomendacaoCarteira
                    {
                        CarteiraId = ativoAtualizado.CarteiraId,
                        GestorId = gestorId,
                        Ticker = ativoAtualizado.Ticker,
                        NomeAtivo = ativoAtualizado.NomeEmpresa ?? ativoAtualizado.Ticker,
                        Acao = "Atualizou",
                        Vies = ativoAtualizado.Vies,
                        PrecoAlvo = ativoAtualizado.PrecoTeto ?? 0,
                        Justificativa = "Atualização estratégica de viés ou preço teto.",
                        DataRecomendacao = DateTime.UtcNow
                    };
                    _context.HistoricoRecomendacoesCarteiras.Add(log);
                }
            }

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