using Microsoft.EntityFrameworkCore;
using StudentCouncil.Data;
using StudentCouncil.Data.Models;
using StudentCouncil.Logic.DTOs;
using StudentCouncil.Logic.Interfaces;
using Microsoft.AspNetCore.Http;

namespace StudentCouncil.Logic.Services;

public class BadgeService : IBadgeService
{
    private readonly AppDbContext _context;
    private readonly LoggerService _logger;

    public BadgeService(AppDbContext context, LoggerService logger)
    {
        _context = context;
        _logger = logger;
    }

    private BadgeResponseDTO MapToDTO(Badge badge)
    {
        return new BadgeResponseDTO
        {
            Id = badge.Id,
            UserId = badge.UserId,
            UserName = badge.User != null ? $"{badge.User.FirstName} {badge.User.LastName}" : "—",
            EventId = badge.EventId,
            EventTitle = badge.Event?.Title ?? "—",
            Role = badge.Role,
            FilePath = badge.FilePath,
            CreatedAt = badge.CreatedAt
        };
    }

    public async Task<ServiceResult<BadgeListResponseDTO>> GetBadgesByUserAsync(int userId)
    {
        try
        {
            List<Badge> badges = await _context.Badges
                .Include(b => b.User)
                .Include(b => b.Event)
                .Where(b => b.UserId == userId)
                .OrderByDescending(b => b.CreatedAt)
                .ToListAsync();

            return ServiceResult<BadgeListResponseDTO>.Ok(new BadgeListResponseDTO
            {
                Count = badges.Count,
                Badges = badges.Select(MapToDTO).ToList()
            });
        }
        catch (Exception ex)
        {
            _logger.Error($"Ошибка получения бейджей пользователя {userId}: {ex.Message}");
            return ServiceResult<BadgeListResponseDTO>.Fail("Ошибка получения бейджей", 500);
        }
    }

    public async Task<ServiceResult<BadgeListResponseDTO>> GetBadgesByEventAsync(int eventId)
    {
        try
        {
            List<Badge> badges = await _context.Badges
                .Include(b => b.User)
                .Include(b => b.Event)
                .Where(b => b.EventId == eventId)
                .OrderByDescending(b => b.CreatedAt)
                .ToListAsync();

            return ServiceResult<BadgeListResponseDTO>.Ok(new BadgeListResponseDTO
            {
                Count = badges.Count,
                Badges = badges.Select(MapToDTO).ToList()
            });
        }
        catch (Exception ex)
        {
            _logger.Error($"Ошибка получения бейджей мероприятия {eventId}: {ex.Message}");
            return ServiceResult<BadgeListResponseDTO>.Fail("Ошибка получения бейджей", 500);
        }
    }

    public async Task<ServiceResult<BadgeResponseDTO>> GetBadgeByIdAsync(int id)
    {
        try
        {
            Badge? badge = await _context.Badges.Include(b => b.User).Include(b => b.Event).FirstOrDefaultAsync(b => b.Id == id);

            if (badge == null)
                return ServiceResult<BadgeResponseDTO>.Fail("Бейдж не найден", 404);

            return ServiceResult<BadgeResponseDTO>.Ok(MapToDTO(badge));
        }
        catch (Exception ex)
        {
            _logger.Error($"Ошибка получения бейджа {id}: {ex.Message}");
            return ServiceResult<BadgeResponseDTO>.Fail("Ошибка получения бейджа", 500);
        }
    }

    public async Task<ServiceResult> CreateBadgeAsync(CreateBadgeDTO dto, IFormFile? file, int currentUserId)
    {
        try
        {
            User? user = await _context.Users.FindAsync(dto.UserId);
            if (user == null)
                return ServiceResult.Fail("Пользователь не найден", 404);

            Event? eventEntity = await _context.Events.FindAsync(dto.EventId);
            if (eventEntity == null)
                return ServiceResult.Fail("Мероприятие не найдено", 404);

            string filePath = string.Empty;

            if (file != null && file.Length > 0)
            {
                string extension = Path.GetExtension(file.FileName).ToLower();
                if (extension != ".pdf")
                    return ServiceResult.Fail("Допустимы только PDF файлы", 400);

                string uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "badges");
                Directory.CreateDirectory(uploadsFolder);

                string fileName = $"{dto.UserId}_{dto.EventId}_{DateTime.Now.Ticks}{extension}";
                string fullPath = Path.Combine(uploadsFolder, fileName);

                using (FileStream stream = new (fullPath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                filePath = $"/badges/{fileName}";
            }

            Badge badge = new Badge
            {
                UserId = dto.UserId,
                EventId = dto.EventId,
                Role = dto.Role,
                FilePath = filePath,
                CreatedAt = DateTime.UtcNow
            };

            _context.Badges.Add(badge);
            await _context.SaveChangesAsync();

            _logger.Info($"Бейдж создан: пользователь {dto.UserId}, мероприятие {dto.EventId}, роль {dto.Role}");
            return ServiceResult.Ok("Бейдж успешно создан");
        }
        catch (Exception ex)
        {
            _logger.Error($"Ошибка создания бейджа: {ex.Message}");
            return ServiceResult.Fail("Ошибка создания бейджа", 500);
        }
    }

    public async Task<ServiceResult> UpdateBadgeAsync(int id, UpdateBadgeDTO dto, int currentUserId)
    {
        try
        {
            Badge? badge = await _context.Badges.FindAsync(id);
            if (badge == null)
                return ServiceResult.Fail("Бейдж не найден", 404);

            badge.Role = dto.Role;
            await _context.SaveChangesAsync();

            _logger.Info($"Бейдж {id} обновлён пользователем {currentUserId}");
            return ServiceResult.Ok("Бейдж успешно обновлён");
        }
        catch (Exception ex)
        {
            _logger.Error($"Ошибка обновления бейджа {id}: {ex.Message}");
            return ServiceResult.Fail("Ошибка обновления бейджа", 500);
        }
    }

    public async Task<ServiceResult> DeleteBadgeAsync(int id, int currentUserId)
    {
        try
        {
            Badge? badge = await _context.Badges.FindAsync(id);
            if (badge == null)
                return ServiceResult.Fail("Бейдж не найден", 404);

            string filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", badge.FilePath.TrimStart('/'));
            if (File.Exists(filePath))
                File.Delete(filePath);

            _context.Badges.Remove(badge);
            await _context.SaveChangesAsync();

            _logger.Info($"Бейдж {id} удалён пользователем {currentUserId}");
            return ServiceResult.Ok("Бейдж успешно удалён");
        }
        catch (Exception ex)
        {
            _logger.Error($"Ошибка удаления бейджа {id}: {ex.Message}");
            return ServiceResult.Fail("Ошибка удаления бейджа", 500);
        }
    }

    public async Task<ServiceResult> UploadBadgeFileAsync(int id, IFormFile file)
    {
        try
        {
            Badge? badge = await _context.Badges.FindAsync(id);
            if (badge == null)
                return ServiceResult.Fail("Бейдж не найден", 404);

            if (!string.IsNullOrEmpty(badge.FilePath))
            {
                string oldPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", badge.FilePath.TrimStart('/'));
                if (File.Exists(oldPath))
                    File.Delete(oldPath);
            }

            string uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "badges");
            Directory.CreateDirectory(uploadsFolder);

            string fileName = $"{badge.UserId}_{badge.EventId}_{DateTime.Now.Ticks}.pdf";
            string fullPath = Path.Combine(uploadsFolder, fileName);

            using (FileStream stream = new (fullPath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            badge.FilePath = $"/badges/{fileName}";
            await _context.SaveChangesAsync();

            return ServiceResult.Ok("Файл успешно загружен");
        }
        catch (Exception ex)
        {
            _logger.Error($"Ошибка загрузки файла для бейджа {id}: {ex.Message}");
            return ServiceResult.Fail("Ошибка загрузки файла", 500);
        }
    }

    public async Task<ServiceResult<(byte[] FileContent, string ContentType, string FileName)>> DownloadBadgeAsync(int id)
    {
        try
        {
            Badge? badge = await _context.Badges.FindAsync(id);
            if (badge == null)
                return ServiceResult<(byte[], string, string)>.Fail("Бейдж не найден", 404);

            string filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", badge.FilePath.TrimStart('/'));
            if (!File.Exists(filePath))
                return ServiceResult<(byte[], string, string)>.Fail("Файл не найден", 404);

            byte[] fileBytes = await File.ReadAllBytesAsync(filePath);
            string fileName = Path.GetFileName(filePath);

            return ServiceResult<(byte[], string, string)>.Ok((fileBytes, "application/pdf", fileName));
        }
        catch (Exception ex)
        {
            _logger.Error($"Ошибка скачивания бейджа {id}: {ex.Message}");
            return ServiceResult<(byte[], string, string)>.Fail("Ошибка скачивания бейджа", 500);
        }
    }
}