using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.Extensions.Configuration;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using SixLabors.ImageSharp.Formats.Webp;

namespace CaddieResearch.Api.Services;

public class BlobService
{
    private readonly string _connectionString;
    private readonly string _containerName = "fotos-perfil"; 

    public BlobService(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("AzureBlobStorage") 
                            ?? throw new Exception("Connection string do Azure não encontrada.");
    }

    public async Task<string> UploadImagemAsync(IFormFile arquivo, string userId)
    {
        var blobServiceClient = new BlobServiceClient(_connectionString);
        var containerClient = blobServiceClient.GetBlobContainerClient(_containerName);
        
        await containerClient.CreateIfNotExistsAsync(PublicAccessType.Blob);

        var nomeArquivo = $"{userId}_{Guid.NewGuid()}.webp";
        var blobClient = containerClient.GetBlobClient(nomeArquivo);

        using var image = await Image.LoadAsync(arquivo.OpenReadStream());

        image.Mutate(x => x.Resize(new ResizeOptions
        {
            Size = new Size(500, 500),
            Mode = ResizeMode.Max 
        }));

        using var memoryStream = new MemoryStream();
        await image.SaveAsWebpAsync(memoryStream, new WebpEncoder { Quality = 80 }); 

        memoryStream.Position = 0;

        await blobClient.UploadAsync(memoryStream, new BlobHttpHeaders { ContentType = "image/webp" });

        return blobClient.Uri.ToString();
    }

    public async Task ExcluirImagemAsync(string urlImagem)
    {
        if (string.IsNullOrEmpty(urlImagem)) return;

        try
        {
            var uri = new Uri(urlImagem);
            var nomeArquivo = Path.GetFileName(uri.LocalPath);

            var blobServiceClient = new BlobServiceClient(_connectionString);
            var containerClient = blobServiceClient.GetBlobContainerClient(_containerName);
            var blobClient = containerClient.GetBlobClient(nomeArquivo);

            await blobClient.DeleteIfExistsAsync();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[ERRO AZURE EXCLUIR]: {ex.Message}");
        }
    }
}