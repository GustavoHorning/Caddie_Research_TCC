using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using CaddieResearch.Api.DTOs.Usuario;
using CaddieResearch.Api.Interfaces;

namespace CaddieResearch.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class UsuarioController : ControllerBase
{
    private readonly IUsuarioService _usuarioService;

    public UsuarioController(IUsuarioService usuarioService)
    {
        _usuarioService = usuarioService;
    }

    private int ObterUsuarioLogadoId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(claim, out int id) ? id : 0;
    }

    [HttpGet("meu-perfil")]
    public async Task<IActionResult> ObterPerfil()
    {
        int userId = ObterUsuarioLogadoId();
        if (userId == 0) return Unauthorized(new { mensagem = "Sessão inválida." });

        var perfil = await _usuarioService.ObterPerfilAsync(userId);
        if (perfil == null) return NotFound(new { mensagem = "Usuário não encontrado." });

        return Ok(perfil);
    }

    [HttpPut("atualizar")]
    public async Task<IActionResult> AtualizarPerfil([FromBody] AtualizarPerfilRequestDto dto) 
    {
        int userId = ObterUsuarioLogadoId();
        if (userId == 0) return Unauthorized();

        var (sucesso, mensagem) = await _usuarioService.AtualizarPerfilAsync(userId, dto);
        if (!sucesso) return BadRequest(new { erro = mensagem });

        return Ok(new { mensagem });
    }

    [HttpPut("alterar-senha")]
    public async Task<IActionResult> AlterarSenha([FromBody] AlterarSenhaRequestDto request)
    {
        int userId = ObterUsuarioLogadoId();
        if (userId == 0) return Unauthorized();

        var (sucesso, mensagem) = await _usuarioService.AlterarSenhaAsync(userId, request);
        if (!sucesso) return BadRequest(new { erro = mensagem });

        return Ok(new { mensagem });
    }
    
    [HttpPost("upload-foto")]
    public async Task<IActionResult> UploadFoto([FromForm] IFormFile foto)
    {
        int userId = ObterUsuarioLogadoId();
        if (userId == 0) return Unauthorized();

        var (sucesso, mensagem, url) = await _usuarioService.UploadFotoAsync(userId, foto);
        if (!sucesso) return BadRequest(new { erro = mensagem });

        return Ok(new { url });
    }
    
    [HttpDelete("remover-foto")]
    public async Task<IActionResult> RemoverFoto()
    {
        int userId = ObterUsuarioLogadoId();
        if (userId == 0) return Unauthorized();

        var (sucesso, mensagem) = await _usuarioService.RemoverFotoAsync(userId);
        if (!sucesso) return BadRequest(new { erro = mensagem });

        return Ok(new { mensagem });
    }
    
    [HttpDelete("excluir-conta")]
    public async Task<IActionResult> ExcluirConta()
    {
        int userId = ObterUsuarioLogadoId();
        if (userId == 0) return Unauthorized();

        var (sucesso, mensagem) = await _usuarioService.ExcluirContaAsync(userId);
        if (!sucesso) return BadRequest(new { erro = mensagem });

        return Ok(new { mensagem });
    }
}