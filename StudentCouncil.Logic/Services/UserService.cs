using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using StudentCouncil.Data.Models;
using StudentCouncil.Logic.DTOs;
using StudentCouncil.Logic.Interfaces;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;

namespace StudentCouncil.Logic.Services;

public class UserService : IUserService
{
    private readonly LoggerService _logger;
    private readonly UserManager<User> _userManager;
    private readonly string[] _validRoles = { "Admin", "Leader", "Member" };

    public enum ProfileAccessResult
    {
        Success,
        NotFound,
        Forbidden
    }


    public UserService(UserManager<User> userManager, LoggerService logger)
    {
        _logger = logger;
        _userManager = userManager;
    }

    private UserDto MapToDto(User user, string role)
    {
        return new UserDto
        {
            Id = user.Id,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Patronymic = user.Patronymic,
            Group = user.Group,
            Email = user.Email,
            PhoneNumber = user.PhoneNumber,
            Telegram = user.Telegram,
            ClothingSize = user.ClothingSize,
            BirthDate = user.BirthDate,
            JoinedAt = user.JoinedAt,
            IsActive = user.IsActive,
            AvatarPath = user.AvatarPath,
            Balance = user.Balance,
            ExperiencePoints = user.ExperiencePoints,
            Level = user.Level,
            EventsAttended = user.EventsAttended,
            EventsOrganized = user.EventsOrganized,
            TasksCompleted = user.TasksCompleted,
            Role = role
        };
    }

    public async Task<List<UserDto>> GetAllUsersWithRolesAsync()
    {
        var users = await _userManager.Users.ToListAsync();
        var result = new List<UserDto>();

        foreach (var user in users)
        {
            var roles = await _userManager.GetRolesAsync(user);
            result.Add(MapToDto(user, roles.FirstOrDefault() ?? "Member"));
        }

        return result;
    }

    public async Task<UserDto?> GetUserByIdAsync(int id)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user == null) return null;

        var roles = await _userManager.GetRolesAsync(user);
        return MapToDto(user, roles.FirstOrDefault() ?? "Member");
    }

    public async Task<(UserDto? User, ProfileAccessResult Result)> GetUserProfileAsync(int id, ClaimsPrincipal currentUser)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user == null)
            return (null, ProfileAccessResult.NotFound);

        var currentUserId = int.Parse(_userManager.GetUserId(currentUser));
        var isAdminOrLeader = currentUser.IsInRole("Admin") || currentUser.IsInRole("Leader");
        var isOwnProfile = currentUserId == user.Id;

        if (!isOwnProfile && !isAdminOrLeader)
            return (null, ProfileAccessResult.Forbidden);

        var roles = await _userManager.GetRolesAsync(user);
        return (MapToDto(user, roles.FirstOrDefault() ?? "Member"), ProfileAccessResult.Success);
    }

    public async Task<bool> CreateUserAsync(CreateUserDto dto, string password)
    {
        try
        {
            var user = new User
            {
                UserName = dto.Email,
                Email = dto.Email,
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                Patronymic = dto.Patronymic,
                Group = dto.Group,
                PhoneNumber = dto.PhoneNumber,
                Telegram = dto.Telegram,
                ClothingSize = dto.ClothingSize,
                JoinedAt = DateTime.UtcNow,
                IsActive = true,
                Balance = 0,
                ExperiencePoints = 0,
                Level = 1,
                EventsAttended = 0,
                EventsOrganized = 0,
                TasksCompleted = 0
            };

            if (dto.BirthDate.HasValue)
            {
                user.BirthDate = DateTime.SpecifyKind(dto.BirthDate.Value, DateTimeKind.Utc);
            }
            else
            {
                user.BirthDate = null;
            }

            var result = await _userManager.CreateAsync(user, password);

            if (result.Succeeded)
            {
                await _userManager.AddToRoleAsync(user, "Member");
                _logger.Info($"Создан пользователь {dto.Email}");
                return true;
            }

            _logger.Warning($"Ошибка создания {dto.Email}: {string.Join(", ", result.Errors)}");
            return false;
        }

        catch (Exception ex)
        {
            _logger.Error($"Исключение при создании {dto.Email}: {ex.Message}");
            return false;

        }
    }

    public async Task<bool> UpdateUserAsync(int id, UpdateUserDto dto, ClaimsPrincipal currentUser)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user == null)
        {
            _logger.Warning($"Попытка обновить несуществующего пользователя {id}");
            return false;
        }

        var currentUserId = int.Parse(_userManager.GetUserId(currentUser));
        var isAdminOrLeader = currentUser.IsInRole("Admin") || currentUser.IsInRole("Leader");
        var isOwnProfile = currentUserId == user.Id;

        if (!isOwnProfile && !isAdminOrLeader)
        {
            _logger.Warning($"Пользователь {currentUserId} попытался редактировать чужой профиль {id}");
            return false;
        }

        user.FirstName = dto.FirstName;
        user.LastName = dto.LastName;
        user.Patronymic = dto.Patronymic;
        user.Group = dto.Group;
        user.PhoneNumber = dto.PhoneNumber;
        user.Telegram = dto.Telegram;
        user.ClothingSize = dto.ClothingSize;
        if (dto.BirthDate.HasValue)
{
    user.BirthDate = DateTime.SpecifyKind(dto.BirthDate.Value, DateTimeKind.Utc);
}
else
{
    user.BirthDate = null;
}

        if (isAdminOrLeader)
        {
            if (!_validRoles.Contains(dto.Role))
            {
                _logger.Warning($"Попытка назначить несуществующую роль {dto.Role}");
                return false;
            }
            user.IsActive = dto.IsActive;
            await _userManager.UpdateAsync(user);

            var currentRoles = await _userManager.GetRolesAsync(user);
            await _userManager.RemoveFromRolesAsync(user, currentRoles);
            await _userManager.AddToRoleAsync(user, dto.Role);
        }
        else
        {
            await _userManager.UpdateAsync(user);
        }
        _logger.Info($"Пользователь {currentUserId} изменил данные профиля");

        return true;
    }

    public async Task<bool> DeleteUserAsync(int id, ClaimsPrincipal currentUser)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user == null)
        {
            _logger.Warning($"Попытка удалить несуществующего пользователя {id}");
            return false;
        }

        var isAdmin = await _userManager.IsInRoleAsync(user, "Admin");
        if (isAdmin)
        {
            var admins = await _userManager.GetUsersInRoleAsync("Admin");
            if (admins.Count <= 1)
            {
                _logger.Warning($"Попытка удалить последнего админа {user.Email}");
                return false;
            }
        }

        await _userManager.DeleteAsync(user);
        return true;
    }

    public async Task<bool> UpdateAvatarAsync(int userId, IFormFile avatar, ClaimsPrincipal currentUser)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
        {
            _logger.Warning($"Попытка загрузить аватар для несуществующего пользователя {userId}");
            return false;
        }

        var currentUserId = int.Parse(_userManager.GetUserId(currentUser));
        if (currentUserId != userId && !currentUser.IsInRole("Admin"))
            return false;

        if (avatar == null || avatar.Length == 0)
        {
            _logger.Warning($"Пользователь {userId} пытался загрузить пустой файл");
            return false;
        }

        var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "avatars");
        Directory.CreateDirectory(uploadsFolder);

        var fileName = $"{user.Id}_{DateTime.Now.Ticks}{Path.GetExtension(avatar.FileName)}";
        var filePath = Path.Combine(uploadsFolder, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await avatar.CopyToAsync(stream);
        }

        user.AvatarPath = $"/avatars/{fileName}";
        await _userManager.UpdateAsync(user);
        _logger.Info($"Пользователь {userId} обновил аватар");
        return true;
    }

    public async Task<bool> DeleteAvatarAsync(int userId, ClaimsPrincipal currentUser)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null) return false;

        var currentUserId = int.Parse(_userManager.GetUserId(currentUser));
        if (currentUserId != userId && !currentUser.IsInRole("Admin") && !currentUser.IsInRole("Leader"))
            return false;

        if (string.IsNullOrEmpty(user.AvatarPath))
            return true;

        var filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", user.AvatarPath.TrimStart('/'));
        if (File.Exists(filePath))
            File.Delete(filePath);

        user.AvatarPath = null;
        await _userManager.UpdateAsync(user);
        return true;
    }
}