using Microsoft.EntityFrameworkCore;
using CaddieResearch.Api.Data;
using CaddieResearch.Api.DTOs.Usuario;
using CaddieResearch.Api.Interfaces;

namespace CaddieResearch.Api.Services;

public class UsuarioService : IUsuarioService
{
    private readonly AppDbContext _context;
    private readonly TokenService _tokenService;
    private readonly BlobService _blobService;

    public UsuarioService(AppDbContext context, TokenService tokenService, BlobService blobService)
    {
        _context = context;
        _tokenService = tokenService;
        _blobService = blobService;
    }

    public async Task<UsuarioPerfilResultDto?> ObterPerfilAsync(int userId)
    {
        var usuario = await _context.Usuarios
            .Include(u => u.Assinaturas)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (usuario == null) return null;

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

        return new UsuarioPerfilResultDto
        {
            Nome = usuario.Nome,
            Email = usuario.Email,
            TipoPerfil = usuario.TipoPerfil,
            Plano = assinaturaAtiva?.PlanoNome,
            EhSocial = usuario.EhSocial,
            FotoPerfilUrl = usuario.FotoPerfilUrl,
            DataVencimento = assinaturaAtiva?.DataVencimento.ToString("dd/MM/yyyy")
        };
    }

    public async Task<(bool Sucesso, string Mensagem)> AtualizarPerfilAsync(int userId, AtualizarPerfilRequestDto dto)
    {
        var usuario = await _context.Usuarios.FindAsync(userId);
        if (usuario == null) return (false, "Usuário não encontrado.");

        usuario.Nome = dto.Nome;
        await _context.SaveChangesAsync();
        return (true, "Perfil atualizado com sucesso!");
    }

    public async Task<(bool Sucesso, string Mensagem)> AlterarSenhaAsync(int userId, AlterarSenhaRequestDto dto)
    {
        var usuario = await _context.Usuarios.FindAsync(userId);
        if (usuario == null) return (false, "Usuário não encontrado.");

        if (!_tokenService.VerifyPassword(dto.SenhaAtual, usuario.SenhaHash))
            return (false, "A senha atual está incorreta.");

        if (_tokenService.VerifyPassword(dto.NovaSenha, usuario.SenhaHash))
            return (false, "A nova senha não pode ser igual à atual.");

        usuario.SenhaHash = _tokenService.HashPassword(dto.NovaSenha);
        await _context.SaveChangesAsync();
        return (true, "Senha alterada com sucesso!");
    }

    public async Task<(bool Sucesso, string Mensagem, string? Url)> UploadFotoAsync(int userId, IFormFile foto)
    {
        if (foto == null || foto.Length == 0) return (false, "Nenhuma imagem foi enviada.", null);

        var usuario = await _context.Usuarios.FindAsync(userId);
        if (usuario == null) return (false, "Usuário não encontrado.", null);

        var urlImagem = await _blobService.UploadImagemAsync(foto, userId.ToString());

        usuario.FotoPerfilUrl = urlImagem;
        await _context.SaveChangesAsync();
        return (true, "Foto atualizada.", urlImagem);
    }

    public async Task<(bool Sucesso, string Mensagem)> RemoverFotoAsync(int userId)
    {
        var usuario = await _context.Usuarios.FindAsync(userId);
        if (usuario == null) return (false, "Usuário não encontrado.");

        if (!string.IsNullOrEmpty(usuario.FotoPerfilUrl))
        {
            await _blobService.ExcluirImagemAsync(usuario.FotoPerfilUrl);
            usuario.FotoPerfilUrl = null;
            await _context.SaveChangesAsync();
        }
        return (true, "Foto removida com sucesso!");
    }

    public async Task<(bool Sucesso, string Mensagem)> ExcluirContaAsync(int userId)
    {
        var usuario = await _context.Usuarios.FindAsync(userId);
        if (usuario == null) return (false, "Usuário não encontrado.");

        if (!string.IsNullOrEmpty(usuario.FotoPerfilUrl))
        {
            await _blobService.ExcluirImagemAsync(usuario.FotoPerfilUrl);
        }

        _context.Usuarios.Remove(usuario);
        await _context.SaveChangesAsync();
        return (true, "Conta excluída com sucesso.");
    }
}