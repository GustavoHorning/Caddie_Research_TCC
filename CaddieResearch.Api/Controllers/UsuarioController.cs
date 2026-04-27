using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using CaddieResearch.Api.Data;
using CaddieResearch.Api.Services; 
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace CaddieResearch.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class UsuarioController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly TokenService _tokenService;

    public UsuarioController(AppDbContext context, TokenService tokenService)
    {
        _context = context;
        _tokenService = tokenService;
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
                .Select(u => new { u.Nome, u.Email, u.TipoPerfil, u.Plano })
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

    [HttpPut("alterar-senha")]
    public async Task<IActionResult> AlterarSenha([FromBody] AlterarSenhaRequest request)
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdString, out int userId)) return Unauthorized();

        var usuario = await _context.Usuarios.FindAsync(userId);
        if (usuario == null) return NotFound();

        if (!_tokenService.VerifyPassword(request.SenhaAtual, usuario.SenhaHash))
            return BadRequest(new { mensagem = "A senha atual está incorreta." });

        if (_tokenService.VerifyPassword(request.NovaSenha, usuario.SenhaHash))
            return BadRequest(new { mensagem = "A nova senha não pode ser igual à atual." });

        usuario.SenhaHash = _tokenService.HashPassword(request.NovaSenha);
        await _context.SaveChangesAsync();

        return Ok(new { mensagem = "Senha alterada com sucesso!" });
    }
}

public class AlterarSenhaRequest
{
    [Required(ErrorMessage = "A senha atual é obrigatória.")]
    public string SenhaAtual { get; set; } = string.Empty;

    [Required(ErrorMessage = "A nova senha é obrigatória.")]
    [MinLength(8, ErrorMessage = "A senha deve ter no mínimo 8 caracteres.")]
    [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$", 
        ErrorMessage = "A senha deve conter pelo menos 8 caracteres, uma letra maiúscula, uma minúscula, um número e um caractere especial.")]
    public string NovaSenha { get; set; } = string.Empty;
}