using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using CaddieResearch.Api.Data;
using CaddieResearch.Api.Models;
using CaddieResearch.Api.Interfaces;
using CaddieResearch.Api.DTOs.Historico;

namespace CaddieResearch.Api.Controllers;

/// <summary>
/// Consulta os logs de histórico, alterações de preço-teto e análises retroativas de ativos.
/// </summary>
[Route("api/historico-carteiras")]
[ApiController]
[Authorize]
public class HistoricoCarteirasController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IAssinaturaService _assinaturaService; 
    private readonly IHistoricoService _historicoService;   

    public HistoricoCarteirasController(AppDbContext context, IAssinaturaService assinaturaService, IHistoricoService historicoService)
    {
        _context = context;
        _assinaturaService = assinaturaService;
        _historicoService = historicoService;
    }

    private int GetUsuarioId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(claim, out int id) ? id : 0;
    }

    private bool EhGestor()
    {
        return User.FindFirst(ClaimTypes.Role)?.Value == "Gestor";
    }

    /// <summary>
    /// Retorna o histórico de recomendações focado nos ativos de uma carteira específica.
    /// </summary>
    /// <remarks>Valida o acesso pelo paywall e agrupa o histórico por ativo, cruzando com os relatórios relacionados.</remarks>
    [HttpGet("{carteiraId}")]
    [ProducesResponseType(typeof(List<HistoricoAtivoAgrupadoDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(HistoricoErrorDto), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetHistoricoCentradoNoAtivo(int carteiraId)
    {
        int usuarioId = GetUsuarioId();
        if (usuarioId == 0) return Unauthorized();

        var carteira = await _context.Carteiras.FindAsync(carteiraId);
        if (carteira == null) return NotFound();

        bool isGestor = EhGestor();
        int nivelAcesso = await _assinaturaService.ObterNivelAcessoAsync(usuarioId);

        if (nivelAcesso < carteira.NivelAcesso && !isGestor) 
            return StatusCode(403, new HistoricoErrorDto { Mensagem = "Seu plano não permite visualizar o histórico desta carteira." });

        var resultado = await _historicoService.ObterHistoricoCentradoNoAtivoAsync(carteiraId, usuarioId, nivelAcesso, isGestor);

        return Ok(resultado);
    }

    /// <summary>
    /// Retorna a timeline completa de todos os ativos da plataforma.
    /// </summary>
    /// <remarks>Processa o histórico e omite dados de preço-alvo/viés de ativos bloqueados pelo plano atual do usuário.</remarks>
    [HttpGet]
    [ProducesResponseType(typeof(List<HistoricoAtivoAgrupadoDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetHistoricoGlobal()
    {
        int usuarioId = GetUsuarioId();
        if (usuarioId == 0) return Unauthorized();

        bool isGestor = EhGestor();
        int nivelAcesso = await _assinaturaService.ObterNivelAcessoAsync(usuarioId);

        var resultado = await _historicoService.ObterHistoricoGlobalAsync(usuarioId, nivelAcesso, isGestor);

        return Ok(resultado);
    }

    /// <summary>
    /// Insere um novo log de recomendação na timeline de um ativo (Acesso Restrito: Gestor).
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Gestor")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CriarRegistro([FromBody] CriarRegistroHistoricoDto dto) 
    {
        int gestorId = GetUsuarioId();
        if (gestorId == 0) return Unauthorized();

        var novoRegistro = new HistoricoRecomendacaoCarteira
        {
            CarteiraId = dto.CarteiraId,
            GestorId = gestorId,
            Ticker = dto.Ticker.ToUpper(),
            NomeAtivo = dto.NomeAtivo,
            Acao = dto.Acao,
            Vies = dto.Vies,
            PrecoAlvo = dto.PrecoAlvo,
            Justificativa = dto.Justificativa,
            DataRecomendacao = DateTime.UtcNow
        };

        _context.HistoricoRecomendacoesCarteiras.Add(novoRegistro);
        await _context.SaveChangesAsync();
        
        // Retornar anônimo aqui na criação não quebra tanto o Scalar, mas o ideal seria mapear para o DTO
        return Ok(new { Mensagem = "Registro criado com sucesso!", Id = novoRegistro.Id });
    }
}