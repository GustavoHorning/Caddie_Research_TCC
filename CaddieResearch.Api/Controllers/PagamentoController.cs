using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using CaddieResearch.Api.Data;
using CaddieResearch.Api.Models;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;

namespace CaddieResearch.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize] 
public class PagamentoController : ControllerBase
{
    private readonly AppDbContext _context;

    public PagamentoController(AppDbContext context)
    {
        _context = context;
    }

    [HttpPost("processar-mock")]
    public async Task<IActionResult> ProcessarPagamentoMock([FromBody] PagamentoRequest request)
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int userId))
        {
            return Unauthorized(new { mensagem = "Usuário não identificado ou sessão expirada." });
        }

        var assinaturaAtiva = await _context.Assinaturas
            .FirstOrDefaultAsync(a => a.UsuarioId == userId && a.Status == "Ativo");

        if (assinaturaAtiva != null)
        {
            if (assinaturaAtiva.PlanoNome == request.PlanoNome)
            {
                return BadRequest(new { mensagem = $"Você já possui o plano {request.PlanoNome} ativo." });
            }

            assinaturaAtiva.Status = "Cancelado";
            _context.Assinaturas.Update(assinaturaAtiva);
        }

        var novaAssinatura = new Assinatura
        {
            UsuarioId = userId,
            PlanoNome = request.PlanoNome,
            ValorPago = request.Preco,
            Status = "Ativo",
            DataInicio = DateTime.UtcNow,
            DataVencimento = DateTime.UtcNow.AddMonths(1)
        };

        var usuario = await _context.Usuarios.FindAsync(userId);
        if (usuario != null)
        {
            usuario.TipoPerfil = request.PlanoNome;
            _context.Usuarios.Update(usuario);
        }

        _context.Assinaturas.Add(novaAssinatura);
        await _context.SaveChangesAsync();

        return Ok(new 
        { 
            mensagem = "Pagamento processado e assinatura ativada!", 
            assinaturaId = novaAssinatura.Id,
            plano = novaAssinatura.PlanoNome
        });
    }
}

public class PagamentoRequest
{
    public string PlanoNome { get; set; } = string.Empty;
    public decimal Preco { get; set; }
}