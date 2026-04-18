using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using StudentCouncil.Logic.Interfaces;

namespace StudentCouncil.Logic.Services;

public class FileStorageService : IFileStorageService
{
    private readonly IWebHostEnvironment _environment;
    private readonly ILoggerService _logger;

    private static readonly byte[] PdfSignature = { 0x25, 0x50, 0x44, 0x46 };
    private static readonly byte[] JpegSignature = { 0xFF, 0xD8, 0xFF };
    private static readonly byte[] PngSignature = { 0x89, 0x50, 0x4E, 0x47 };
    private static readonly byte[] GifSignature = { 0x47, 0x49, 0x46, 0x38 };

    public FileStorageService(IWebHostEnvironment environment, ILoggerService logger)
    {
        _environment = environment;
        _logger = logger;
    }

    public async Task<string> SaveFileAsync(IFormFile file, string subFolder, string[] allowedExtensions, string? fileNamePrefix = null)
    {
        if (file == null || file.Length == 0)
            throw new ArgumentException("Файл не выбран или пуст");


        string extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowedExtensions.Contains(extension))
        {
            throw new InvalidOperationException($"Недопустимое расширение. Разрешены: {string.Join(", ", allowedExtensions)}");
        }

        if (file.Length > 10_485_760)
            throw new InvalidOperationException("Файл превышает максимальный размер (10 МБ)");

        await ValidateFileContentAsync(file, extension);

        string fileName = $"{fileNamePrefix ?? ""}{DateTime.Now.Ticks}{extension}";

        string webRootPath = _environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot");
        string targetFolder = Path.Combine(webRootPath, subFolder);

        if (!Directory.Exists(targetFolder))
        {
            Directory.CreateDirectory(targetFolder);
        }

        string fullPath = Path.Combine(targetFolder, fileName);

        using (var stream = new FileStream(fullPath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        string relativePath = "/" + Path.Combine(subFolder, fileName).Replace("\\", "/");

        _logger.Info($"Файл сохранён: {relativePath}");
        return relativePath;
    }

    public void DeleteFile(string? path)
    {
        if (string.IsNullOrWhiteSpace(path))
            return;

        try
        {
            string webRootPath = _environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot");
            string fullPath = Path.Combine(webRootPath, path.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));

            if (File.Exists(fullPath))
            {
                File.Delete(fullPath);
                _logger.Info($"Файл удалён: {path}");
            }
        }
        catch (Exception ex)
        {
            _logger.Error($"Ошибка удаления файла {path}: {ex.Message}");
        }
    }

    public bool FileExists(string? path)
    {
        if (string.IsNullOrWhiteSpace(path))
            return false;

        string webRootPath = _environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot");
        string fullPath = Path.Combine(webRootPath, path.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));

        return File.Exists(fullPath);
    }

    public async Task<byte[]> ReadFileBytesAsync(string path)
    {
        if (string.IsNullOrWhiteSpace(path))
            throw new ArgumentException("Путь к файлу не указан");

        string webRootPath = _environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot");
        string fullPath = Path.Combine(webRootPath, path.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));

        if (!File.Exists(fullPath))
            throw new FileNotFoundException($"Файл не найден: {path}");

        return await File.ReadAllBytesAsync(fullPath);
    }

    public (string ContentType, string FileName) GetFileInfo(string path)
    {
        string fileName = Path.GetFileName(path);
        string extension = Path.GetExtension(fileName).ToLowerInvariant();

        string contentType = extension switch
        {
            ".pdf" => "application/pdf",
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".gif" => "image/gif",
            _ => "application/octet-stream"
        };

        return (contentType, fileName);
    }

    private static async Task ValidateFileContentAsync(IFormFile file, string extension)
    {
        if (extension == ".pdf")
        {
            if (!await CheckFileSignatureAsync(file, PdfSignature))
                throw new InvalidOperationException("Файл не является действительным PDF");
        }
        else if (extension == ".jpg" || extension == ".jpeg")
        {
            if (!await CheckFileSignatureAsync(file, JpegSignature))
                throw new InvalidOperationException("Файл не является действительным JPEG");
        }
        else if (extension == ".png")
        {
            if (!await CheckFileSignatureAsync(file, PngSignature))
                throw new InvalidOperationException("Файл не является действительным PNG");
        }
        else if (extension == ".gif")
        {
            if (!await CheckFileSignatureAsync(file, GifSignature))
                throw new InvalidOperationException("Файл не является действительным GIF");
        }
    }

    private static async Task<bool> CheckFileSignatureAsync(IFormFile file, byte[] expectedSignature)
    {
        if (file.Length < expectedSignature.Length)
            return false;

        using var stream = file.OpenReadStream();
        byte[] header = new byte[expectedSignature.Length];
        await stream.ReadAsync(header, 0, expectedSignature.Length);

        return header.SequenceEqual(expectedSignature);
    }
}