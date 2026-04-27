using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using CaddieResearch.Api.Data;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;

namespace CaddieResearch.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class AssinaturaController : ControllerBase
{
    private readonly AppDbContext _context;

    public AssinaturaController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("atual")]
    public async Task<IActionResult> ObterAssinaturaAtual()
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int userId))
            return Unauthorized(new { mensagem = "Sessão inválida." });

        var assinatura = await _context.Assinaturas
            .Where(a => a.UsuarioId == userId && a.Status == "Ativo")
            .OrderByDescending(a => a.DataInicio)
            .FirstOrDefaultAsync();

        if (assinatura == null)
            return NotFound(new { mensagem = "Nenhuma assinatura ativa." });

        return Ok(new 
        { 
            plano = assinatura.PlanoNome, 
            valor = assinatura.ValorPago, 
            vencimento = assinatura.DataVencimento 
        });
    }

    [HttpPost("cancelar")]
    public async Task<IActionResult> CancelarAssinatura()
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int userId))
            return Unauthorized(new { mensagem = "Sessão inválida." });

        var assinatura = await _context.Assinaturas
            .FirstOrDefaultAsync(a => a.UsuarioId == userId && a.Status == "Ativo");

        if (assinatura == null)
            return BadRequest(new { mensagem = "Você não possui uma assinatura ativa para cancelar." });

        assinatura.Status = "Cancelado";
        _context.Assinaturas.Update(assinatura);
        
        var usuario = await _context.Usuarios.FindAsync(userId);
        if (usuario != null) 
        {
            usuario.TipoPerfil = "Usuario"; 
            _context.Usuarios.Update(usuario);
        }

        await _context.SaveChangesAsync();
        return Ok(new { mensagem = "Assinatura cancelada com sucesso. Sentiremos sua falta!" });
    }
}