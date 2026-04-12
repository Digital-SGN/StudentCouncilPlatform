using Microsoft.AspNetCore.Http;

namespace StudentCouncil.Logic.Interfaces;

public interface IFileStorageService
{
    Task<string> SaveFileAsync(IFormFile file, string subFolder, string[] allowedExtensions, string? fileNamePrefix = null);
    void DeleteFile(string? relativePath);
    bool FileExists(string? relativePath);
    Task<byte[]> ReadFileBytesAsync(string relativePath);
    (string ContentType, string FileName) GetFileInfo(string relativePath);
}