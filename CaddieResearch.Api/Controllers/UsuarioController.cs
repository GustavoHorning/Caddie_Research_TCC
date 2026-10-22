using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using CaddieResearch.Api.Data;
using CaddieResearch.Api.Services; 
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;
using System;

namespace CaddieResearch.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class UsuarioController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly TokenService _tokenService;
    private readonly BlobService _blobService; 

    public UsuarioController(AppDbContext context, TokenService tokenService, BlobService blobService)
    {
        _context = context;
        _tokenService = tokenService;
        _blobService = blobService;
    }

    /// <summary>
    /// Retorna os dados de perfil e plano do usuário logado.
    /// </summary>
    /// <remarks>
    /// Além de retornar os dados (nome, e-mail, foto), este endpoint funciona como validador de sessão: caso a assinatura do usuário tenha expirado (data vencida), o sistema atualiza o status de volta para "Sem Plano" em tempo real.
    /// </remarks>
    /// <response code="200">Dados do perfil carregados.</response>
    /// <response code="401">Sessão inválida ou token JWT expirado.</response>
    [HttpGet("meu-perfil")]
    [ProducesResponseType(200)]
    [ProducesResponseType(401)]
    public async Task<IActionResult> ObterPerfil()
    {
        try
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int userId))
                return Unauthorized(new { mensagem = "Sessão inválida." });

            var usuario = await _context.Usuarios
                .Include(u => u.Assinaturas)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (usuario == null)
                return NotFound(new { mensagem = "Usuário não encontrado." });

            var assinaturaAtiva = usuario.Assinaturas?
                .Where(a => a.Status == "Ativo" && a.DataVencimento > DateTime.UtcNow)
                .OrderByDescending(a => a.DataVencimento)
                .FirstOrDefault();

            if (assinaturaAtiva == null && !string.IsNullOrEmpty(usuario.Plano))
            {
                usuario.Plano = null;

                if (usuario.Assinaturas != null)
                {
                    foreach(var ass in usuario.Assinaturas.Where(a => a.Status == "Ativo"))
                    {
                        ass.Status = "Expirado";
                    }
                }
                await _context.SaveChangesAsync();
            }

            return Ok(new {
                usuario.Nome,
                usuario.Email,
                usuario.TipoPerfil,
                Plano = assinaturaAtiva?.PlanoNome, 
                usuario.EhSocial,
                usuario.FotoPerfilUrl,
                dataVencimento = assinaturaAtiva != null ? assinaturaAtiva.DataVencimento.ToString("dd/MM/yyyy") : null
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[ERRO PERFIL]: {ex.Message}");
            return StatusCode(500, new { mensagem = "Erro interno no servidor.", detalhe = ex.Message });
        }
    }

    /// <summary>
    /// Atualiza o nome de exibição do usuário.
    /// </summary>
    [HttpPut("atualizar")]
    [ProducesResponseType(200)]
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

    /// <summary>
    /// Permite a alteração segura da senha na área logada.
    /// </summary>
    /// <remarks>
    /// Exige a senha atual para garantir que o dono da conta está realizando a operação, aplicando as validações de força de senha para a nova credencial.
    /// </remarks>
    [HttpPut("alterar-senha")]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
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
    
    /// <summary>
    /// Envia uma nova foto de perfil e salva no provedor Cloud.
    /// </summary>
    /// <remarks>
    /// O arquivo é convertido e hospedado no Azure Blob Storage. A URL gerada é salva no banco de dados do usuário e propagada para a UI.
    /// </remarks>
    [HttpPost("upload-foto")]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> UploadFoto(IFormFile foto)
    {
        try
        {
            if (foto == null || foto.Length == 0)
                return BadRequest(new { mensagem = "Nenhuma imagem foi enviada." });

            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdString, out int userId)) return Unauthorized();

            var usuario = await _context.Usuarios.FindAsync(userId);
            if (usuario == null) return NotFound();

            var urlImagem = await _blobService.UploadImagemAsync(foto, userIdString);

            usuario.FotoPerfilUrl = urlImagem;
            await _context.SaveChangesAsync();

            return Ok(new { url = urlImagem });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[ERRO UPLOAD]: {ex.Message}");
            return StatusCode(500, new { mensagem = "Erro ao processar a imagem no servidor." });
        }
    }
    
    /// <summary>
    /// Remove a foto de perfil do usuário.
    /// </summary>
    /// <remarks>
    /// Além de limpar a URL no banco de dados, exclui permanentemente o arquivo de imagem hospedado no Azure Blob Storage para poupar espaço.
    /// </remarks>
    [HttpDelete("remover-foto")]
    [ProducesResponseType(200)]
    public async Task<IActionResult> RemoverFoto()
    {
        try
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdString, out int userId)) return Unauthorized();

            var usuario = await _context.Usuarios.FindAsync(userId);
            if (usuario == null) return NotFound();

            if (!string.IsNullOrEmpty(usuario.FotoPerfilUrl))
            {
                await _blobService.ExcluirImagemAsync(usuario.FotoPerfilUrl);
                
                usuario.FotoPerfilUrl = null;
                await _context.SaveChangesAsync();
            }

            return Ok(new { mensagem = "Foto removida com sucesso!" });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[ERRO REMOVER FOTO]: {ex.Message}");
            return StatusCode(500, new { mensagem = "Erro ao remover a imagem do servidor." });
        }
    }
    
    /// <summary>
    /// Exclusão definitiva da conta (LGPD).
    /// </summary>
    /// <remarks>
    /// Deleta permanentemente o usuário do banco de dados e limpa todos os artefatos visuais anexados (como foto de perfil no Azure) de acordo com o direito ao esquecimento.
    /// </remarks>
    [HttpDelete("excluir-conta")]
    [ProducesResponseType(200)]
    public async Task<IActionResult> ExcluirConta()
    {
        try
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdString, out int userId)) return Unauthorized();

            var usuario = await _context.Usuarios.FindAsync(userId);
            if (usuario == null) return NotFound();

            if (!string.IsNullOrEmpty(usuario.FotoPerfilUrl))
            {
                await _blobService.ExcluirImagemAsync(usuario.FotoPerfilUrl);
            }

            _context.Usuarios.Remove(usuario);
            await _context.SaveChangesAsync();

            return Ok(new { mensagem = "Conta excluída com sucesso." });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[ERRO EXCLUIR CONTA]: {ex.Message}");
            return StatusCode(500, new { mensagem = "Erro ao excluir conta." });
        }
    }
}

public class AlterarSenhaRequest
{
    /// <summary>
    /// A senha antiga para validação de segurança.
    /// </summary>
    /// <example>SenhaVelha123!</example>
    [Required(ErrorMessage = "A senha atual é obrigatória.")]
    public string SenhaAtual { get; set; } = string.Empty;

    /// <summary>
    /// A nova senha desejada, que deve passar pelos testes de robustez.
    /// </summary>
    /// <example>Caddie@Nova2026</example>
    [Required(ErrorMessage = "A nova senha é obrigatória.")]
    [MinLength(8, ErrorMessage = "A senha deve ter no mínimo 8 caracteres.")]
    [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$", 
        ErrorMessage = "A senha deve conter pelo menos 8 caracteres, uma letra maiúscula, uma minúscula, um número e um caractere especial.")]
    public string NovaSenha { get; set; } = string.Empty;
}