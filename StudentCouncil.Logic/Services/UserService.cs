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

    private UserDTO MapToDto(User user, string role)
    {
        return new UserDTO
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

    public async Task<ServiceResult<List<UserDTO>>> GetAllUsersAsync()
    {
        try
        {
            List<User> users = await _userManager.Users.ToListAsync();
            List<UserDTO> result = new List<UserDTO>();

            foreach (User? user in users)
            {
                IList<string> roles = await _userManager.GetRolesAsync(user);
                result.Add(MapToDto(user, roles.FirstOrDefault() ?? "Member"));
            }

            return ServiceResult<List<UserDTO>>.Ok(result);
        }
        catch (Exception ex)
        {
            _logger.Error($"Ошибка получения списка пользователей: {ex.Message}");
            return ServiceResult<List<UserDTO>>.Fail("Ошибка получения списка пользователей", 500);
        }
    }

    public async Task<ServiceResult<UserDTO>> GetUserByIdAsync(int id)
    {
        try
        {
            User? user = await _userManager.FindByIdAsync(id.ToString());
            if (user == null)
                return ServiceResult<UserDTO>.Fail("Пользователь не найден", 404);

            IList<string> roles = await _userManager.GetRolesAsync(user);
            return ServiceResult<UserDTO>.Ok(MapToDto(user, roles.FirstOrDefault() ?? "Member"));
        }
        catch (Exception ex)
        {
            _logger.Error($"Ошибка получения пользователя {id}: {ex.Message}");
            return ServiceResult<UserDTO>.Fail("Ошибка получения пользователя", 500);
        }
    }

    public async Task<ServiceResult<UserDTO>> GetUserProfileAsync(int id, ClaimsPrincipal currentUser)
    {
        try
        {
            User? user = await _userManager.FindByIdAsync(id.ToString());
            if (user == null)
                return ServiceResult<UserDTO>.Fail("Пользователь не найден", 404);

            int currentUserId = int.Parse(_userManager.GetUserId(currentUser));
            bool isAdminOrLeader = currentUser.IsInRole("Admin") || currentUser.IsInRole("Leader");
            bool isOwnProfile = currentUserId == user.Id;

            if (!isOwnProfile && !isAdminOrLeader)
                return ServiceResult<UserDTO>.Fail("У вас нет прав на просмотр этого профиля", 403);

            IList<string> roles = await _userManager.GetRolesAsync(user);
            return ServiceResult<UserDTO>.Ok(MapToDto(user, roles.FirstOrDefault() ?? "Member"));
        }
        catch (Exception ex)
        {
            _logger.Error($"Ошибка получения профиля {id}: {ex.Message}");
            return ServiceResult<UserDTO>.Fail("Ошибка получения профиля", 500);
        }
    }

    public async Task<ServiceResult> CreateUserAsync(CreateUserDTO dto, string password)
    {
        try
        {
            User? existingUser = await _userManager.FindByEmailAsync(dto.Email);
            if (existingUser != null)
                return ServiceResult.Fail("Пользователь с таким email уже существует", 400);

            User user = new User
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
                user.BirthDate = DateTime.SpecifyKind(dto.BirthDate.Value, DateTimeKind.Utc);

            IdentityResult result = await _userManager.CreateAsync(user, password);

            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                _logger.Warning($"Ошибка создания {dto.Email}: {errors}");
                return ServiceResult.Fail($"Ошибка создания: {errors}", 400);
            }

            await _userManager.AddToRoleAsync(user, dto.Role ?? "Member");
            _logger.Info($"Создан пользователь {dto.Email}");
            return ServiceResult.Ok("Пользователь успешно создан");
        }
        catch (Exception ex)
        {
            _logger.Error($"Исключение при создании {dto.Email}: {ex.Message}");
            return ServiceResult.Fail("Ошибка создания пользователя", 500);
        }
    }

    public async Task<ServiceResult> UpdateUserAsync(int id, UpdateUserDTO dto, ClaimsPrincipal currentUser)
    {
        try
        {
            User? user = await _userManager.FindByIdAsync(id.ToString());
            if (user == null)
            {
                _logger.Warning($"Попытка обновить несуществующего пользователя {id}");
                return ServiceResult.Fail("Пользователь не найден", 404);
            }

            int currentUserId = int.Parse(_userManager.GetUserId(currentUser));
            bool isAdminOrLeader = currentUser.IsInRole("Admin") || currentUser.IsInRole("Leader");
            bool isOwnProfile = currentUserId == user.Id;

            if (!isOwnProfile && !isAdminOrLeader)
            {
                _logger.Warning($"Пользователь {currentUserId} попытался редактировать чужой профиль {id}");
                return ServiceResult.Fail("У вас нет прав на редактирование этого пользователя", 403);
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
                    return ServiceResult.Fail("Недопустимая роль", 400);
                }

                if (dto.IsActive == false && await _userManager.IsInRoleAsync(user, "Admin"))
                {
                    IList<User> admins = await _userManager.GetUsersInRoleAsync("Admin");
                    int activeAdmins = admins.Count(a => a.IsActive);

                    if (activeAdmins <= 1)
                    {
                        _logger.Warning($"Попытка заблокировать последнего активного администратора {user.Email}");
                        return ServiceResult.Fail("Нельзя заблокировать последнего активного администратора", 400);
                    }
                }

                bool isCurrentlyAdmin = await _userManager.IsInRoleAsync(user, "Admin");
                bool willBeAdmin = dto.Role == "Admin";

                if (isCurrentlyAdmin && !willBeAdmin)
                {
                    IList<User> admins = await _userManager.GetUsersInRoleAsync("Admin");
                    int activeAdmins = admins.Count(a => a.IsActive);

                    if (activeAdmins <= 1)
                    {
                        _logger.Warning($"Попытка снять роль Admin у последнего администратора {user.Email}");
                        return ServiceResult.Fail("Нельзя снять роль администратора у последнего активного админа", 400);
                    }
                }

                string? currentRole = (await _userManager.GetRolesAsync(user)).FirstOrDefault();
                if (isOwnProfile && (dto.IsActive != user.IsActive || dto.Role != currentRole))
                {
                    _logger.Warning($"Пользователь {currentUserId} попытался изменить свой статус или роль");
                    return ServiceResult.Fail("Вы не можете изменить свой статус или роль", 403);
                }

                bool wasActive = user.IsActive;
                user.IsActive = dto.IsActive;

                if (wasActive && !user.IsActive)
                {
                    await _userManager.UpdateSecurityStampAsync(user);
                    _logger.Info($"Пользователь {user.Email} заблокирован, все сессии аннулированы");
                }

                await _userManager.UpdateAsync(user);

                IList<string> currentRoles = await _userManager.GetRolesAsync(user);
                await _userManager.RemoveFromRolesAsync(user, currentRoles);
                await _userManager.AddToRoleAsync(user, dto.Role);
            }
            else
            {
                await _userManager.UpdateAsync(user);
            }

            _logger.Info($"Пользователь {currentUserId} изменил данные профиля");
            return ServiceResult.Ok("Данные успешно обновлены");
        }
        catch (Exception ex)
        {
            _logger.Error($"Ошибка обновления пользователя {id}: {ex.Message}");
            return ServiceResult.Fail("Ошибка обновления пользователя", 500);
        }
    }

    public async Task<ServiceResult> DeleteUserAsync(int id, ClaimsPrincipal currentUser)
    {
        try
        {
            User? user = await _userManager.FindByIdAsync(id.ToString());
            if (user == null)
                return ServiceResult.Fail("Пользователь не найден", 404);

            bool isAdmin = await _userManager.IsInRoleAsync(user, "Admin");
            if (isAdmin)
            {
                IList<User> admins = await _userManager.GetUsersInRoleAsync("Admin");
                if (admins.Count <= 1)
                    return ServiceResult.Fail("Нельзя удалить последнего администратора", 400);
            }

            await _userManager.DeleteAsync(user);
            _logger.Info($"Пользователь {user.Email} удалён");
            return ServiceResult.Ok("Пользователь успешно удален");
        }
        catch (Exception ex)
        {
            _logger.Error($"Ошибка удаления пользователя {id}: {ex.Message}");
            return ServiceResult.Fail("Ошибка удаления пользователя", 500);
        }
    }

    public async Task<ServiceResult> UpdateAvatarAsync(int userId, IFormFile avatar, ClaimsPrincipal currentUser)
    {
        try
        {
            User? user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null)
                return ServiceResult.Fail("Пользователь не найден", 404);

            int currentUserId = int.Parse(_userManager.GetUserId(currentUser));
            if (currentUserId != userId && !currentUser.IsInRole("Admin"))
                return ServiceResult.Fail("У вас нет прав на изменение аватара этого пользователя", 403);

            if (avatar == null || avatar.Length == 0)
                return ServiceResult.Fail("Файл не выбран", 400);

            string uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "avatars");
            Directory.CreateDirectory(uploadsFolder);

            string fileName = $"{user.Id}_{DateTime.Now.Ticks}{Path.GetExtension(avatar.FileName)}";
            string filePath = Path.Combine(uploadsFolder, fileName);

            using (FileStream stream = new FileStream(filePath, FileMode.Create))
            {
                await avatar.CopyToAsync(stream);
            }

            user.AvatarPath = $"/avatars/{fileName}";
            await _userManager.UpdateAsync(user);
            _logger.Info($"Пользователь {userId} обновил аватар");
            return ServiceResult.Ok("Аватар успешно загружен");
        }
        catch (Exception ex)
        {
            _logger.Error($"Ошибка загрузки аватара для пользователя {userId}: {ex.Message}");
            return ServiceResult.Fail("Ошибка загрузки аватара", 500);
        }
    }

    public async Task<ServiceResult> DeleteAvatarAsync(int userId, ClaimsPrincipal currentUser)
    {
        try
        {
            User? user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null)
                return ServiceResult.Fail("Пользователь не найден", 404);

            int currentUserId = int.Parse(_userManager.GetUserId(currentUser));
            if (currentUserId != userId && !currentUser.IsInRole("Admin") && !currentUser.IsInRole("Leader"))
                return ServiceResult.Fail("У вас нет прав на удаление аватара этого пользователя", 403);

            if (string.IsNullOrEmpty(user.AvatarPath))
                return ServiceResult.Ok("Аватар уже был удалён");

            string filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", user.AvatarPath.TrimStart('/'));
            if (File.Exists(filePath))
                File.Delete(filePath);

            user.AvatarPath = null;
            await _userManager.UpdateAsync(user);
            _logger.Info($"Пользователь {userId} удалил аватар");
            return ServiceResult.Ok("Аватар  успешно удален");
        }
        catch (Exception ex)
        {
            _logger.Error($"Ошибка удаления аватара пользователя {userId}: {ex.Message}");
            return ServiceResult.Fail("Ошибка удаления аватара", 500);
        }
    }
}