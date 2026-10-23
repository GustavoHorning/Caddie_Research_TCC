using Microsoft.EntityFrameworkCore;
using CaddieResearch.Api.Data;
using CaddieResearch.Api.Models;
using CaddieResearch.Api.Interfaces;

namespace CaddieResearch.Api.Services;

public class AssinaturaService : IAssinaturaService
{
    private readonly AppDbContext _context;

    public AssinaturaService(AppDbContext context)
    {
        _context = context;
    }

    public async Task ProcessarPagamentoAprovadoAsync(int usuarioId, string planoEscolhido, string metodoPagamento, decimal valorPago, string checkoutId)
    {
        var usuario = await _context.Usuarios.FindAsync(usuarioId);
        if (usuario == null)
        {
            throw new Exception($"Usuário com ID {usuarioId} não existe no banco de dados.");
        }

        var assinaturasAtivas = await _context.Assinaturas
            .Where(a => a.UsuarioId == usuarioId && a.Status == "Ativo")
            .ToListAsync();

        foreach (var assinatura in assinaturasAtivas)
        {
            assinatura.Status = "Cancelado";
        }

        usuario.Plano = planoEscolhido;

        var novaAssinatura = new Assinatura
        {
            UsuarioId = usuarioId,
            PlanoNome = planoEscolhido,
            ValorPago = valorPago,
            Status = "Ativo",
            CheckoutId = checkoutId,
            TipoPagamento = metodoPagamento,
            DataInicio = DateTime.UtcNow,
            DataVencimento = DateTime.UtcNow.AddMonths(1)
        };

        _context.Assinaturas.Add(novaAssinatura);
        await _context.SaveChangesAsync();
    }
    
    public async Task<Assinatura?> ObterAssinaturaAtivaAsync(int usuarioId)
    {
        return await _context.Assinaturas
            .Where(a => a.UsuarioId == usuarioId && a.Status == "Ativo" && a.DataVencimento > DateTime.UtcNow)
            .OrderByDescending(a => a.DataVencimento)
            .FirstOrDefaultAsync();
    }

    public async Task<Usuario?> CancelarAssinaturaAsync(int usuarioId)
    {
        var assinaturasAtivas = await _context.Assinaturas
            .Where(a => a.UsuarioId == usuarioId && a.Status == "Ativo")
            .ToListAsync();

        foreach (var assinatura in assinaturasAtivas)
        {
            assinatura.Status = "Cancelado";
        }

        var usuario = await _context.Usuarios.FindAsync(usuarioId);
        if (usuario != null)
        {
            usuario.Plano = null; 
        }

        await _context.SaveChangesAsync();
        
        return usuario;
    }
    
    public async Task<int> ObterNivelAcessoAsync(int usuarioId)
    {
        var usuario = await _context.Usuarios.FindAsync(usuarioId);
        if (usuario == null) return 0;

        if (usuario.TipoPerfil == "Gestor" || usuario.TipoPerfil == "Admin")
        {
            return 99;
        }

        var assinaturaValida = await _context.Assinaturas
            .Where(a => a.UsuarioId == usuarioId && a.Status == "Ativo" && a.DataVencimento > DateTime.UtcNow)
            .OrderByDescending(a => a.DataVencimento)
            .FirstOrDefaultAsync();

        string planoReal = assinaturaValida?.PlanoNome ?? "";

        return planoReal switch
        {
            "Basic" => 1,
            "Premium" => 2,
            "Black" => 3,
            _ => 0
        };
    }
    
    public async Task<Usuario?> VerificarStatusPagamentoAsync(int usuarioId, string planoDesejado)
    {
        var assinaturaAtiva = await _context.Assinaturas
            .FirstOrDefaultAsync(a => a.UsuarioId == usuarioId 
                                      && a.Status == "Ativo" 
                                      && a.PlanoNome.ToLower() == planoDesejado.ToLower());

        if (assinaturaAtiva != null)
        {
            return await _context.Usuarios.FindAsync(usuarioId);
        }

        return null;
    }
}