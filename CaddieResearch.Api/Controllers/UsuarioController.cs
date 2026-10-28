using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using CaddieResearch.Api.DTOs.Usuario;
using CaddieResearch.Api.Interfaces;

namespace CaddieResearch.Api.Controllers;

/// <summary>
/// Gerencia os dados do perfil, configurações de segurança e exclusão de contas.
/// </summary>
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

    /// <summary>
    /// Retorna os dados completos do perfil do usuário, status do plano e data de vencimento.
    /// </summary>
    [HttpGet("meu-perfil")]
    [ProducesResponseType(typeof(UsuarioPerfilResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(UsuarioResponseDto), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(UsuarioResponseDto), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ObterPerfil()
    {
        int userId = ObterUsuarioLogadoId();
        if (userId == 0) return Unauthorized(new UsuarioResponseDto { Mensagem = "Sessão inválida." });

        var perfil = await _usuarioService.ObterPerfilAsync(userId);
        if (perfil == null) return NotFound(new UsuarioResponseDto { Mensagem = "Usuário não encontrado." });

        return Ok(perfil);
    }

    /// <summary>
    /// Atualiza os dados básicos do perfil (Nome).
    /// </summary>
    [HttpPut("atualizar")]
    [ProducesResponseType(typeof(UsuarioResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(UsuarioResponseDto), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AtualizarPerfil([FromBody] AtualizarPerfilRequestDto dto) 
    {
        int userId = ObterUsuarioLogadoId();
        if (userId == 0) return Unauthorized();

        var (sucesso, mensagem) = await _usuarioService.AtualizarPerfilAsync(userId, dto);
        if (!sucesso) return BadRequest(new UsuarioResponseDto { Mensagem = mensagem });

        return Ok(new UsuarioResponseDto { Mensagem = mensagem });
    }

    /// <summary>
    /// Altera a senha do usuário com base na senha anterior.
    /// </summary>
    [HttpPut("alterar-senha")]
    [ProducesResponseType(typeof(UsuarioResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(UsuarioResponseDto), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AlterarSenha([FromBody] AlterarSenhaRequestDto request)
    {
        int userId = ObterUsuarioLogadoId();
        if (userId == 0) return Unauthorized();

        var (sucesso, mensagem) = await _usuarioService.AlterarSenhaAsync(userId, request);
        if (!sucesso) return BadRequest(new UsuarioResponseDto { Mensagem = mensagem });

        return Ok(new UsuarioResponseDto { Mensagem = mensagem });
    }
    
    /// <summary>
    /// Faz o upload de uma nova foto de perfil para o Azure Blob Storage.
    /// </summary>
    [HttpPost("upload-foto")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(UsuarioResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(UsuarioResponseDto), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UploadFoto([FromForm] IFormFile foto)
    {
        int userId = ObterUsuarioLogadoId();
        if (userId == 0) return Unauthorized();

        var (sucesso, mensagem, url) = await _usuarioService.UploadFotoAsync(userId, foto);
        if (!sucesso) return BadRequest(new UsuarioResponseDto { Mensagem = mensagem });

        return Ok(new UsuarioResponseDto { Url = url });
    }
    
    /// <summary>
    /// Remove a foto de perfil atual do usuário e a deleta do Storage.
    /// </summary>
    [HttpDelete("remover-foto")]
    [ProducesResponseType(typeof(UsuarioResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(UsuarioResponseDto), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RemoverFoto()
    {
        int userId = ObterUsuarioLogadoId();
        if (userId == 0) return Unauthorized();

        var (sucesso, mensagem) = await _usuarioService.RemoverFotoAsync(userId);
        if (!sucesso) return BadRequest(new UsuarioResponseDto { Mensagem = mensagem });

        return Ok(new UsuarioResponseDto { Mensagem = mensagem });
    }
    
    /// <summary>
    /// Exclui permanentemente a conta do usuário e todos os arquivos associados a ele.
    /// </summary>
    [HttpDelete("excluir-conta")]
    [ProducesResponseType(typeof(UsuarioResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(UsuarioResponseDto), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ExcluirConta()
    {
        int userId = ObterUsuarioLogadoId();
        if (userId == 0) return Unauthorized();

        var (sucesso, mensagem) = await _usuarioService.ExcluirContaAsync(userId);
        if (!sucesso) return BadRequest(new UsuarioResponseDto { Mensagem = mensagem });

        return Ok(new UsuarioResponseDto { Mensagem = mensagem });
    }
}