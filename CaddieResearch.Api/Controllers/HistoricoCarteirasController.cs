using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using CaddieResearch.Api.Data;
using CaddieResearch.Api.Models;
using CaddieResearch.Api.Interfaces;
using CaddieResearch.Api.DTOs.Historico;

namespace CaddieResearch.Api.Controllers;

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

    [HttpGet("{carteiraId}")]
    public async Task<IActionResult> GetHistoricoCentradoNoAtivo(int carteiraId)
    {
        int usuarioId = GetUsuarioId();
        if (usuarioId == 0) return Unauthorized();

        var carteira = await _context.Carteiras.FindAsync(carteiraId);
        if (carteira == null) return NotFound();

        bool isGestor = EhGestor();
        int nivelAcesso = await _assinaturaService.ObterNivelAcessoAsync(usuarioId);

        if (nivelAcesso < carteira.NivelAcesso && !isGestor) 
            return StatusCode(403, new { mensagem = "Seu plano não permite visualizar o histórico desta carteira." });

        var resultado = await _historicoService.ObterHistoricoCentradoNoAtivoAsync(carteiraId, usuarioId, nivelAcesso, isGestor);

        return Ok(resultado);
    }

    [HttpGet]
    public async Task<IActionResult> GetHistoricoGlobal()
    {
        int usuarioId = GetUsuarioId();
        if (usuarioId == 0) return Unauthorized();

        bool isGestor = EhGestor();
        int nivelAcesso = await _assinaturaService.ObterNivelAcessoAsync(usuarioId);

        var resultado = await _historicoService.ObterHistoricoGlobalAsync(usuarioId, nivelAcesso, isGestor);

        return Ok(resultado);
    }

    [HttpPost]
    [Authorize(Roles = "Gestor")]
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
        
        return Ok(novoRegistro);
    }
}