using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using CaddieResearch.Api.Data;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;

namespace CaddieResearch.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class UsuarioController : ControllerBase
{
    private readonly AppDbContext _context;

    public UsuarioController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("meu-perfil")]
    public async Task<IActionResult> ObterPerfil()
    {
        try
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int userId))
                return Unauthorized(new { mensagem = "Sessão inválida." });

            var usuario = await _context.Usuarios
                .Where(u => u.Id == userId)
                .Select(u => new { u.Nome, u.Email, u.TipoPerfil })
                .FirstOrDefaultAsync();

            if (usuario == null)
                return NotFound(new { mensagem = "Usuário não encontrado." });

            return Ok(usuario);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[ERRO PERFIL]: {ex.Message}");
            return StatusCode(500, new { mensagem = "Erro interno no servidor.", detalhe = ex.Message });
        }
    }

    [HttpPut("atualizar")]
    public async Task<IActionResult> AtualizarPerfil([FromBody] string novoNome)
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdString, out int userId)) return Unauthorized();

        var usuario = await _context.Usuarios.FindAsync(userId);
        if (usuario == null) return NotFound();

        usuario.Nome = novoNome;
        await _context.SaveChangesAsync();

        return Ok(new { mensagem = "Perfil atualizado com sucesso!" });
    }
}