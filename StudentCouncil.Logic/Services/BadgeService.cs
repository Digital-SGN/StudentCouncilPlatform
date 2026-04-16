using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using StudentCouncil.Data;
using StudentCouncil.Data.Models;
using StudentCouncil.Logic.DTOs;
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

    public async Task<ServiceResult<BadgeListResponseDTO>> GetBadgesByUserAsync(int userId, ClaimsPrincipal currentUser)
    {
        try
        {
            var (currentUserId, _, _, isAdminOrLeader) = GetUserInfo(currentUser);

            if (userId != currentUserId && !isAdminOrLeader)
                return ServiceResult<BadgeListResponseDTO>.Forbidden("У вас нет прав на просмотр бейджей этого пользователя");

            List<Badge> badges = await _context.Badges
                .Include(b => b.User)
                .Include(b => b.Event)
                .Where(b => b.UserId == userId)
                .OrderByDescending(b => b.CreatedAt)
                .ToListAsync();

            return ServiceResult<BadgeListResponseDTO>.Ok(new BadgeListResponseDTO
            {
                Count = badges.Count,
                Badges = [.. badges.Select(Mapper.ToBadgeDTO)]
            });
        }
        catch (Exception ex)
        {
            _logger.Error($"Ошибка получения бейджей пользователя {userId}: {ex.Message}");
            return ServiceResult<BadgeListResponseDTO>.InternalError("Ошибка получения бейджей");
        }
    }

    public async Task<ServiceResult<BadgeListResponseDTO>> GetBadgesByEventAsync(int eventId, ClaimsPrincipal currentUser)
    {
        try
        {
            var (_, _, _, isAdminOrLeader) = GetUserInfo(currentUser);

            if (!isAdminOrLeader)
                return ServiceResult<BadgeListResponseDTO>.Forbidden("У вас нет прав на просмотр бейджей мероприятия");

            Event? eventEntity = await _context.Events.FindAsync(eventId);
            if (eventEntity == null)
                return ServiceResult<BadgeListResponseDTO>.NotFound("Мероприятие не найдено");

            List<Badge> badges = await _context.Badges
                .Include(b => b.User)
                .Include(b => b.Event)
                .Where(b => b.EventId == eventId)
                .OrderByDescending(b => b.CreatedAt)
                .ToListAsync();

            return ServiceResult<BadgeListResponseDTO>.Ok(new BadgeListResponseDTO
            {
                Count = badges.Count,
                Badges = [.. badges.Select(Mapper.ToBadgeDTO)]
            });
        }
        catch (Exception ex)
        {
            _logger.Error($"Ошибка получения бейджей мероприятия {eventId}: {ex.Message}");
            return ServiceResult<BadgeListResponseDTO>.InternalError("Ошибка получения бейджей");
        }
    }

    public async Task<ServiceResult<BadgeResponseDTO>> GetBadgeByIdAsync(int id, ClaimsPrincipal currentUser)
    {
        try
        {
            var (currentUserId, _, _, isAdminOrLeader) = GetUserInfo(currentUser);

            Badge? badge = await _context.Badges.Include(b => b.User).Include(b => b.Event).FirstOrDefaultAsync(b => b.Id == id);

            if (badge == null)
                return ServiceResult<BadgeResponseDTO>.NotFound("Бейдж не найден");

            if (badge.UserId != currentUserId && !isAdminOrLeader)
                return ServiceResult<BadgeResponseDTO>.Forbidden("У вас нет прав на просмотр этого бейджа");

            return ServiceResult<BadgeResponseDTO>.Ok(Mapper.ToBadgeDTO(badge));
        }
        catch (Exception ex)
        {
            _logger.Error($"Ошибка получения бейджа {id}: {ex.Message}");
            return ServiceResult<BadgeResponseDTO>.InternalError("Ошибка получения бейджа");
        }
    }

    public async Task<ServiceResult> CreateBadgeAsync(CreateBadgeDTO dto, IFormFile? file, ClaimsPrincipal currentUser)
    {
        try
        {
            var (currentUserId, _, _, _) = GetUserInfo(currentUser);

            User? user = await _context.Users.FindAsync(dto.UserId);
            if (user == null)
                return ServiceResult.NotFound("Пользователь не найден");

            Event? eventEntity = await _context.Events.FindAsync(dto.EventId);
            if (eventEntity == null)
                return ServiceResult.NotFound("Мероприятие не найдено");

            string filePath = string.Empty;

            if (file != null && file.Length > 0)
            {
                try
                {
                    string prefix = $"{dto.UserId}_{dto.EventId}_";
                    filePath = await _fileStorage.SaveFileAsync(file, badgesFolder, pdfExtensions, prefix);
                }
                catch (InvalidOperationException ex)
                {
                    return ServiceResult.BadRequest(ex.Message);
                }
            }

            Badge badge = Mapper.ToBadgeEntity(dto, filePath);

            _context.Badges.Add(badge);
            await _context.SaveChangesAsync();

            _logger.Info($"Бейдж создан пользователем {currentUserId}: UserId={dto.UserId}, EventId={dto.EventId}");
            return ServiceResult.Created("Бейдж успешно создан");
        }
        catch (Exception ex)
        {
            _logger.Error($"Ошибка создания бейджа: {ex.Message}");
            return ServiceResult.InternalError("Ошибка создания бейджа");
        }
    }

    public async Task<ServiceResult> UpdateBadgeAsync(int id, UpdateBadgeDTO dto, ClaimsPrincipal currentUser)
    {
        try
        {
            var (currentUserId, isAdmin, _, _) = GetUserInfo(currentUser);

            if (!isAdmin)
                return ServiceResult.Forbidden("Только администратор может загружать файлы бейджей");

            Badge? badge = await _context.Badges.FindAsync(id);
            if (badge == null)
                return ServiceResult.NotFound("Бейдж не найден");

            Mapper.UpdateBadgeEntity(badge, dto);
            await _context.SaveChangesAsync();

            _logger.Info($"Бейдж {id} обновлён пользователем {currentUserId}");
            return ServiceResult.Ok("Бейдж успешно обновлён");
        }
        catch (Exception ex)
        {
            _logger.Error($"Ошибка обновления бейджа {id}: {ex.Message}");
            return ServiceResult.InternalError("Ошибка обновления бейджа");
        }
    }


    public async Task<ServiceResult> DeleteBadgeAsync(int id, ClaimsPrincipal currentUser)
    {
        try
        {
            var (currentUserId, _, _, _) = GetUserInfo(currentUser);

            Badge? badge = await _context.Badges.FindAsync(id);
            if (badge == null)
                return ServiceResult.NotFound("Бейдж не найден");

            _fileStorage.DeleteFile(badge.FilePath);

            _context.Badges.Remove(badge);
            await _context.SaveChangesAsync();

            _logger.Info($"Бейдж {id} удалён пользователем {currentUserId}");
            return ServiceResult.Ok("Бейдж успешно удалён");
        }
        catch (Exception ex)
        {
            _logger.Error($"Ошибка удаления бейджа {id}: {ex.Message}");
            return ServiceResult.InternalError("Ошибка удаления бейджа");
        }
    }


    public async Task<ServiceResult> UploadBadgeFileAsync(int id, IFormFile file, ClaimsPrincipal currentUser)
    {
        try
        {
            Badge? badge = await _context.Badges.FindAsync(id);
            if (badge == null)
                return ServiceResult.NotFound("Бейдж не найден");

            _fileStorage.DeleteFile(badge.FilePath);

            try
            {
                string prefix = $"{badge.UserId}_{badge.EventId}_";
                badge.FilePath = await _fileStorage.SaveFileAsync(file, badgesFolder, pdfExtensions, prefix);
            }
            catch (InvalidOperationException ex)
            {
                return ServiceResult.BadRequest(ex.Message);
            }

            await _context.SaveChangesAsync();
            var (currentUserId, _, _, _) = GetUserInfo(currentUser);
            return ServiceResult.Ok($"Файл успешно загружен пользователем {currentUserId}");
        }
        catch (Exception ex)
        {
            _logger.Error($"Ошибка загрузки файла для бейджа {id}: {ex.Message}");
            return ServiceResult.InternalError("Ошибка загрузки файла");
        }
    }

    public async Task<ServiceResult<(byte[] FileContent, string ContentType, string FileName)>> DownloadBadgeAsync(int id, ClaimsPrincipal currentUser)
    {
        try
        {
            var (currentUserId, _, _, isAdminOrLeader) = GetUserInfo(currentUser);

            Badge? badge = await _context.Badges.FindAsync(id);
            if (badge == null)
                return ServiceResult<(byte[], string, string)>.NotFound("Бейдж не найден");

            if (badge.UserId != currentUserId && !isAdminOrLeader)
            {
                _logger.Warning($"Пользователь {currentUserId} попытался скачать чужой бейдж {id}");
                return ServiceResult<(byte[], string, string)>.Forbidden("У вас нет прав на скачивание этого бейджа");
            }

            if (!_fileStorage.FileExists(badge.FilePath))
                return ServiceResult<(byte[], string, string)>.NotFound("Файл не найден");

            byte[] fileBytes = await _fileStorage.ReadFileBytesAsync(badge.FilePath);
            var (contentType, fileName) = _fileStorage.GetFileInfo(badge.FilePath);

            return ServiceResult<(byte[], string, string)>.Ok((fileBytes, contentType, fileName));
        }
        catch (Exception ex)
        {
            _logger.Error($"Ошибка скачивания бейджа {id}: {ex.Message}");
            return ServiceResult<(byte[], string, string)>.InternalError("Ошибка скачивания бейджа");
        }
    }
}