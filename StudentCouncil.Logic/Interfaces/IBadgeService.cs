using Microsoft.AspNetCore.Http;
using StudentCouncil.Logic.DTOs;
using System.Security.Claims;

namespace StudentCouncil.Logic.Interfaces;

public interface IBadgeService
{
    /// <summary>Возвращает бейджи пользователя по его идентификатору.</summary>
    Task<BadgeListResponseDTO> GetBadgesByUserAsync(int userId, ClaimsPrincipal currentUser);

    /// <summary>Возвращает бейджи участников указанного мероприятия.</summary>
    Task<BadgeListResponseDTO> GetBadgesByEventAsync(int eventId, ClaimsPrincipal currentUser);

    /// <summary>Возвращает бейдж по идентификатору.</summary>
    Task<BadgeResponseDTO> GetBadgeByIdAsync(int id, ClaimsPrincipal currentUser);

    /// <summary>Создаёт бейдж для пользователя с привязкой к мероприятию.</summary>
    Task CreateBadgeAsync(CreateBadgeDTO dto, IFormFile? file, ClaimsPrincipal currentUser);

    /// <summary>Обновляет данные бейджа.</summary>
    Task UpdateBadgeAsync(int id, UpdateBadgeDTO dto, ClaimsPrincipal currentUser);

    /// <summary>Удаляет бейдж.</summary>
    Task DeleteBadgeAsync(int id, ClaimsPrincipal currentUser);

    /// <summary>Загружает или заменяет файл бейджа.</summary>
    Task UploadBadgeFileAsync(int id, IFormFile file, ClaimsPrincipal currentUser);

    /// <summary>Удаляет файл бейджа.</summary>
    Task DeleteBadgeFileAsync(int id, ClaimsPrincipal currentUser);

    /// <summary>Возвращает содержимое файла бейджа и параметры ответа на скачивание.</summary>
    Task<(byte[] FileContent, string ContentType, string FileName)> DownloadBadgeAsync(int id, ClaimsPrincipal currentUser);
}