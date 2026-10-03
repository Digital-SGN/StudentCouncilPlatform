using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using StudentCouncil.Data;
using StudentCouncil.Data.Models;
using StudentCouncil.Logic.DTOs;
using StudentCouncil.Logic.Exceptions;
using StudentCouncil.Logic.Interfaces;
using System.Security.Claims;

namespace StudentCouncil.Logic.Services;

public class BadgeService : IBadgeService
{
    private readonly AppDbContext _context;
    private readonly IFileStorageService _fileStorage;
    private readonly ILoggerService _logger;

    public const string badgesFolder = "badges";
    public static readonly string[] pdfExtensions = { ".pdf" };

    public BadgeService(AppDbContext context, IFileStorageService fileStorage, ILoggerService logger)
    {
        _context = context;
        _fileStorage = fileStorage;
        _logger = logger;
    }

    private (int userId, bool isAdmin, bool isLeader, bool isAdminOrLeader) GetUserInfo(ClaimsPrincipal user)
    {
        var userIdStr = user.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0";
        int userId = int.Parse(userIdStr);
        bool isAdmin = user.IsInRole("Admin");
        bool isLeader = user.IsInRole("Leader");
        return (userId, isAdmin, isLeader, isAdmin || isLeader);
    }

    public async Task<BadgeListResponseDTO> GetBadgesByUserAsync(int userId, ClaimsPrincipal currentUser)
    {
        var (currentUserId, _, _, isAdminOrLeader) = GetUserInfo(currentUser);

        if (userId != currentUserId && !isAdminOrLeader)
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
        var (_, _, _, isAdminOrLeader) = GetUserInfo(currentUser);

        if (!isAdminOrLeader)
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
        var (currentUserId, _, _, isAdminOrLeader) = GetUserInfo(currentUser);

        Badge? badge = await _context.Badges
            .Include(b => b.User)
            .Include(b => b.Event)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (badge == null)
            throw new NotFoundException("Бейдж не найден");

        if (badge.UserId != currentUserId && !isAdminOrLeader)
            throw new ForbiddenException("У вас нет прав на просмотр этого бейджа");

        return Mapper.ToBadgeDTO(badge);
    }

    public async Task CreateBadgeAsync(CreateBadgeDTO dto, IFormFile? file, ClaimsPrincipal currentUser)
    {
        var (currentUserId, _, _, _) = GetUserInfo(currentUser);

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

        _logger.Info($"Бейдж создан пользователем {currentUserId}: UserId={dto.UserId}, EventId={dto.EventId}");
    }

    public async Task UpdateBadgeAsync(int id, UpdateBadgeDTO dto, ClaimsPrincipal currentUser)
    {
        var (currentUserId, isAdmin, _, _) = GetUserInfo(currentUser);

        if (!isAdmin)
            throw new ForbiddenException("Только администратор может обновлять бейджи");

        Badge? badge = await _context.Badges.FindAsync(id);
        if (badge == null)
            throw new NotFoundException("Бейдж не найден");

        Mapper.UpdateBadgeEntity(badge, dto);
        await _context.SaveChangesAsync();

        _logger.Info($"Бейдж {id} обновлён пользователем {currentUserId}");
    }

    public async Task DeleteBadgeAsync(int id, ClaimsPrincipal currentUser)
    {
        var (currentUserId, _, _, _) = GetUserInfo(currentUser);

        Badge? badge = await _context.Badges.FindAsync(id);
        if (badge == null)
            throw new NotFoundException("Бейдж не найден");

        _fileStorage.DeleteFile(badge.FilePath);

        _context.Badges.Remove(badge);
        await _context.SaveChangesAsync();

        _logger.Info($"Бейдж {id} удалён пользователем {currentUserId}");
    }

    public async Task UploadBadgeFileAsync(int id, IFormFile file, ClaimsPrincipal currentUser)
    {
        var (currentUserId, _, _, _) = GetUserInfo(currentUser);

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

        _logger.Info($"Файл бейджа {id} загружен пользователем {currentUserId}");
    }

    public async Task DeleteBadgeFileAsync(int id, ClaimsPrincipal currentUser)
    {
        var (currentUserId, isAdmin, _, _) = GetUserInfo(currentUser);

        if (!isAdmin)
            throw new ForbiddenException("Только администратор может удалять файлы бейджей");

        Badge? badge = await _context.Badges.FindAsync(id);
        if (badge == null)
            throw new NotFoundException("Бейдж не найден");

        if (string.IsNullOrEmpty(badge.FilePath))
            throw new BadRequestException("У бейджа нет файла для удаления");

        _fileStorage.DeleteFile(badge.FilePath);
        badge.FilePath = null;
        await _context.SaveChangesAsync();

        _logger.Info($"Файл бейджа {id} удалён пользователем {currentUserId}");
    }

    public async Task<(byte[] FileContent, string ContentType, string FileName)> DownloadBadgeAsync(int id, ClaimsPrincipal currentUser)
    {
        var (currentUserId, _, _, isAdminOrLeader) = GetUserInfo(currentUser);

        Badge? badge = await _context.Badges.FindAsync(id);
        if (badge == null)
            throw new NotFoundException("Бейдж не найден");

        if (badge.UserId != currentUserId && !isAdminOrLeader)
        {
            _logger.Warning($"Пользователь {currentUserId} попытался скачать чужой бейдж {id}");
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