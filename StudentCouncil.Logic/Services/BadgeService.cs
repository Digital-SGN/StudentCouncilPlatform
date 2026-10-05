using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using StudentCouncil.Data;
using StudentCouncil.Data.Models;
using StudentCouncil.Logic.DTOs;
using StudentCouncil.Logic.Exceptions;
using StudentCouncil.Logic.Extensions;
using StudentCouncil.Logic.Interfaces;
using StudentCouncil.Logic.Mapping;
using System.Security.Claims;

namespace StudentCouncil.Logic.Services;

public class BadgeService : IBadgeService
{
    private readonly AppDbContext _context;
    private readonly IFileStorageService _fileStorage;
    private readonly ILogger<BadgeService> _logger;

    public const string badgesFolder = "badges";
    public static readonly string[] pdfExtensions = { ".pdf" };

    public BadgeService(AppDbContext context, IFileStorageService fileStorage, ILogger<BadgeService> logger)
    {
        _context = context;
        _fileStorage = fileStorage;
        _logger = logger;
    }

    public async Task<BadgeListResponseDTO> GetBadgesByUserAsync(int userId, ClaimsPrincipal currentUser)
    {
        int currentUserId = currentUser.GetUserId();

        if (userId != currentUserId && !currentUser.IsAdminOrLeader())
            throw new ForbiddenException("У вас нет прав на просмотр бейджей этого пользователя");

        List<Badge> badges = await _context.Badges
            .Include(b => b.User)
            .Include(b => b.Event)
            .Where(b => b.UserId == userId)
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync();

        return new BadgeListResponseDTO
        {
            Count = badges.Count,
            Badges = [.. badges.Select(Mapper.ToBadgeDTO)]
        };
    }

    public async Task<BadgeListResponseDTO> GetBadgesByEventAsync(int eventId, ClaimsPrincipal currentUser)
    {
        if (!currentUser.IsAdminOrLeader())
            throw new ForbiddenException("У вас нет прав на просмотр бейджей мероприятия");

        Event? eventEntity = await _context.Events
            .Where(e => !e.IsDeleted)
            .FirstOrDefaultAsync(e => e.Id == eventId);

        if (eventEntity == null)
            throw new NotFoundException("Мероприятие не найдено");

        List<Badge> badges = await _context.Badges
            .Include(b => b.User)
            .Include(b => b.Event)
            .Where(b => b.EventId == eventId)
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync();

        return new BadgeListResponseDTO
        {
            Count = badges.Count,
            Badges = [.. badges.Select(Mapper.ToBadgeDTO)]
        };
    }

    public async Task<BadgeResponseDTO> GetBadgeByIdAsync(int id, ClaimsPrincipal currentUser)
    {
        int currentUserId = currentUser.GetUserId();

        Badge? badge = await _context.Badges
            .Include(b => b.User)
            .Include(b => b.Event)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (badge == null)
            throw new NotFoundException("Бейдж не найден");

        if (badge.UserId != currentUserId && !currentUser.IsAdminOrLeader())
            throw new ForbiddenException("У вас нет прав на просмотр этого бейджа");

        return Mapper.ToBadgeDTO(badge);
    }

    public async Task CreateBadgeAsync(CreateBadgeDTO dto, IFormFile? file, ClaimsPrincipal currentUser)
    {
        if (!currentUser.IsAdmin())
            throw new ForbiddenException("Только администратор может создавать бейджи");

        int currentUserId = currentUser.GetUserId();

        User? user = await _context.Users.FindAsync(dto.UserId);
        if (user == null)
            throw new NotFoundException("Пользователь не найден");

        Event? eventEntity = await _context.Events.FindAsync(dto.EventId);
        if (eventEntity == null)
            throw new NotFoundException("Мероприятие не найдено");

        string? filePath = null;

        if (file != null && file.Length > 0)
        {
            try
            {
                string prefix = $"{dto.UserId}_{dto.EventId}_";
                filePath = await _fileStorage.SaveFileAsync(file, badgesFolder, pdfExtensions, prefix);
            }
            catch (InvalidOperationException ex)
            {
                throw new BadRequestException(ex.Message);
            }
        }

        Badge badge = Mapper.ToBadgeEntity(dto, filePath);

        _context.Badges.Add(badge);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Бейдж создан пользователем {CurrentUserId}: UserId={UserId}, EventId={EventId}",
            currentUserId, dto.UserId, dto.EventId);
    }

    public async Task UpdateBadgeAsync(int id, UpdateBadgeDTO dto, ClaimsPrincipal currentUser)
    {
        if (!currentUser.IsAdmin())
            throw new ForbiddenException("Только администратор может обновлять бейджи");

        int currentUserId = currentUser.GetUserId();

        Badge? badge = await _context.Badges.FindAsync(id);
        if (badge == null)
            throw new NotFoundException("Бейдж не найден");

        Mapper.UpdateBadgeEntity(badge, dto);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Бейдж {BadgeId} обновлён пользователем {CurrentUserId}", id, currentUserId);
    }

    public async Task DeleteBadgeAsync(int id, ClaimsPrincipal currentUser)
    {
        if (!currentUser.IsAdmin())
            throw new ForbiddenException("Только администратор может удалять бейджи");

        int currentUserId = currentUser.GetUserId();

        Badge? badge = await _context.Badges.FindAsync(id);
        if (badge == null)
            throw new NotFoundException("Бейдж не найден");

        _fileStorage.DeleteFile(badge.FilePath);

        _context.Badges.Remove(badge);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Бейдж {BadgeId} удалён пользователем {CurrentUserId}", id, currentUserId);
    }

    public async Task UploadBadgeFileAsync(int id, IFormFile file, ClaimsPrincipal currentUser)
    {
        if (!currentUser.IsAdmin())
            throw new ForbiddenException("Только администратор может загружать файлы бейджей");

        int currentUserId = currentUser.GetUserId();

        Badge? badge = await _context.Badges.FindAsync(id);
        if (badge == null)
            throw new NotFoundException("Бейдж не найден");

        string? oldPath = badge.FilePath;

        string newPath;
        try
        {
            string prefix = $"{badge.UserId}_{badge.EventId}_";
            newPath = await _fileStorage.SaveFileAsync(file, badgesFolder, pdfExtensions, prefix);
        }
        catch (InvalidOperationException ex)
        {
            throw new BadRequestException(ex.Message);
        }

        badge.FilePath = newPath;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch
        {
            _fileStorage.DeleteFile(newPath);
            badge.FilePath = oldPath;
            throw;
        }

        if (!string.IsNullOrEmpty(oldPath))
            _fileStorage.DeleteFile(oldPath);

        _logger.LogInformation("Файл бейджа {BadgeId} загружен пользователем {CurrentUserId}", id, currentUserId);
    }

    public async Task DeleteBadgeFileAsync(int id, ClaimsPrincipal currentUser)
    {
        if (!currentUser.IsAdmin())
            throw new ForbiddenException("Только администратор может удалять файлы бейджей");

        int currentUserId = currentUser.GetUserId();

        Badge? badge = await _context.Badges.FindAsync(id);
        if (badge == null)
            throw new NotFoundException("Бейдж не найден");

        if (string.IsNullOrEmpty(badge.FilePath))
            throw new BadRequestException("У бейджа нет файла для удаления");

        _fileStorage.DeleteFile(badge.FilePath);
        badge.FilePath = null;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Файл бейджа {BadgeId} удалён пользователем {CurrentUserId}", id, currentUserId);
    }

    public async Task<(byte[] FileContent, string ContentType, string FileName)> DownloadBadgeAsync(int id, ClaimsPrincipal currentUser)
    {
        int currentUserId = currentUser.GetUserId();

        Badge? badge = await _context.Badges.FindAsync(id);
        if (badge == null)
            throw new NotFoundException("Бейдж не найден");

        if (badge.UserId != currentUserId && !currentUser.IsAdminOrLeader())
        {
            _logger.LogWarning("Пользователь {CurrentUserId} попытался скачать чужой бейдж {BadgeId}",
                currentUserId, id);
            throw new ForbiddenException("У вас нет прав на скачивание этого бейджа");
        }

        if (string.IsNullOrEmpty(badge.FilePath))
            throw new NotFoundException("У бейджа нет файла");

        if (!_fileStorage.FileExists(badge.FilePath))
            throw new NotFoundException("Файл не найден");

        byte[] fileBytes = await _fileStorage.ReadFileBytesAsync(badge.FilePath);
        var (contentType, fileName) = _fileStorage.GetFileInfo(badge.FilePath);

        return (fileBytes, contentType, fileName);
    }
}