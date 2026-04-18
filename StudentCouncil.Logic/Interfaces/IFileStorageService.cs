using Microsoft.AspNetCore.Http;

namespace StudentCouncil.Logic.Interfaces;

public interface IFileStorageService
{
    Task<string> SaveFileAsync(IFormFile file, string subFolder, string[] allowedExtensions, string? fileNamePrefix = null);
    void DeleteFile(string? path);
    bool FileExists(string? path);
    Task<byte[]> ReadFileBytesAsync(string path);
    (string ContentType, string FileName) GetFileInfo(string path);
}