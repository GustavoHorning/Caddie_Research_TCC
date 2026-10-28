using System.Text;
using Microsoft.AspNetCore.Http;
using UglyToad.PdfPig;
using CaddieResearch.Api.Interfaces;

namespace CaddieResearch.Api.Services;

public class PdfService : IPdfService
{
    public string? ExtrairTextoDoPdf(IFormFile arquivoPdf)
    {
        try
        {
            using var stream = arquivoPdf.OpenReadStream();
            using var pdf = PdfDocument.Open(stream);
            var sb = new StringBuilder();
            foreach (var pagina in pdf.GetPages()) sb.AppendLine(pagina.Text);
            return sb.ToString();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[ERRO DE INDEXAÇÃO PDF]: {ex.Message}");
            return null; 
        }
    }
}