using Microsoft.AspNetCore.Http;

namespace CaddieResearch.Api.Interfaces;

public interface IPdfService
{
    string? ExtrairTextoDoPdf(IFormFile arquivoPdf);
}