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
    private readonly UserManager<User> _userManager;
    private readonly IFileStorageService _fileStorage;
    private readonly ILoggerService _logger;

    public const string avatarsFolder = "avatars";
    public static readonly string[] imageExtensions = { ".jpg", ".jpeg", ".png", ".gif" };

    public UserService(UserManager<User> userManager, IFileStorageService fileStorage, ILoggerService logger)
    {
        _userManager = userManager;
        _fileStorage = fileStorage;
        _logger = logger;
    }

    public async Task<ServiceResult<UserListResponseDTO>> GetAllUsersAsync()
    {
        try
        {
            List<User> users = await _userManager.Users.ToListAsync();
            List<UserDTO> result = new List<UserDTO>();

            foreach (User? user in users)
            {
                IList<string> roles = await _userManager.GetRolesAsync(user);
                result.Add(Mapper.ToUserDTO(user, roles.FirstOrDefault() ?? "Member"));
            }

            return ServiceResult<UserListResponseDTO>.Ok(new UserListResponseDTO
            {
                Count = result.Count,
                Users = result

            });
        }
        catch (Exception ex)
        {
            _logger.Error($"Ошибка получения списка пользователей: {ex.Message}");
            return ServiceResult<UserListResponseDTO>.InternalError("Ошибка получения списка пользователей");
        }
    }

    public async Task<ServiceResult<UserDTO>> GetUserByIdAsync(int id, ClaimsPrincipal currentUser)
    {
        try
        {
            User? user = await _userManager.FindByIdAsync(id.ToString());
            if (user == null)
                return ServiceResult<UserDTO>.NotFound("Пользователь не найден");
            if (currentUser != null)
            {
                string? userIdStr = _userManager.GetUserId(currentUser);
                if (string.IsNullOrEmpty(userIdStr))
                    return ServiceResult<UserDTO>.Unauthorized("Не удалось определить пользователя");

                int currentUserId = int.Parse(userIdStr);
                bool isAdminOrLeader = currentUser.IsInRole("Admin") || currentUser.IsInRole("Leader");
                bool isOwnProfile = currentUserId == user.Id;

                if (!isOwnProfile && !isAdminOrLeader)
                    return ServiceResult<UserDTO>.Forbidden("У вас нет прав на просмотр этого профиля");
            }

            IList<string> roles = await _userManager.GetRolesAsync(user);
            return ServiceResult<UserDTO>.Ok(Mapper.ToUserDTO(user, roles.FirstOrDefault() ?? "Member"));
        }
        catch (Exception ex)
        {
            _logger.Error($"Ошибка получения пользователя {id}: {ex.Message}");
            return ServiceResult<UserDTO>.InternalError("Ошибка получения пользователя");
        }
    }

    public async Task<ServiceResult> CreateUserAsync(CreateUserDTO dto, string password)
    {
        try
        {
            User? existingUser = await _userManager.FindByEmailAsync(dto.Email);
            if (existingUser != null)
                return ServiceResult.Conflict("Пользователь с таким email уже существует");

            User user = Mapper.ToUserEntity(dto);

            IdentityResult result = await _userManager.CreateAsync(user, password);

            if (!result.Succeeded)
            {
                string errors = string.Join(", ", result.Errors.Select(e => e.Description));
                _logger.Warning($"Ошибка создания {dto.Email}: {errors}");
                return ServiceResult.BadRequest($"Ошибка создания: {errors}");
            }

            await _userManager.AddToRoleAsync(user, dto.Role ?? "Member");
            _logger.Info($"Создан пользователь {dto.Email}");
            return ServiceResult.Created("Пользователь успешно создан");
        }
        catch (Exception ex)
        {
            _logger.Error($"Исключение при создании {dto.Email}: {ex.Message}");
            return ServiceResult.InternalError("Ошибка создания пользователя");
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
                return ServiceResult.NotFound("Пользователь не найден");
            }

            string? userIdStr = _userManager.GetUserId(currentUser);
            if (string.IsNullOrEmpty(userIdStr))
                return ServiceResult.Unauthorized("Не удалось определить пользователя");

            int currentUserId = int.Parse(userIdStr);
            bool isAdminOrLeader = currentUser.IsInRole("Admin") || currentUser.IsInRole("Leader");
            bool isOwnProfile = currentUserId == user.Id;

            if (!isOwnProfile && !isAdminOrLeader)
            {
                _logger.Warning($"Пользователь {currentUserId} попытался редактировать чужой профиль {id}");
                return ServiceResult.Forbidden("У вас нет прав на редактирование этого пользователя");
            }

            if (isAdminOrLeader && !string.IsNullOrEmpty(dto.Email) && dto.Email != user.Email)
            {
                var existingUser = await _userManager.FindByEmailAsync(dto.Email);
                if (existingUser != null && existingUser.Id != user.Id)
                {
                    return ServiceResult.Conflict("Пользователь с таким email уже существует");
                }
            }

            Mapper.UpdateUserEntity(user, dto, isAdminOrLeader);

            if (isAdminOrLeader)
            {
                if (dto.Role != "Admin" && dto.Role != "Leader" && dto.Role != "Member")
                {
                    _logger.Warning($"Попытка назначить несуществующую роль {dto.Role}");
                    return ServiceResult.BadRequest("Недопустимая роль");
                }

                if (dto.IsActive == false && await _userManager.IsInRoleAsync(user, "Admin"))
                {
                    IList<User> admins = await _userManager.GetUsersInRoleAsync("Admin");
                    int activeAdmins = admins.Count(a => a.IsActive);

                    if (activeAdmins <= 1)
                    {
                        _logger.Warning($"Попытка заблокировать последнего активного администратора {user.Email}");
                        return ServiceResult.Conflict("Нельзя заблокировать последнего активного администратора");
                    }
                }

                bool isCurrentlyAdmin = await _userManager.IsInRoleAsync(user, "Admin");

                if (isCurrentlyAdmin && !(dto.Role == "Admin"))
                {
                    IList<User> admins = await _userManager.GetUsersInRoleAsync("Admin");
                    int activeAdmins = admins.Count(a => a.IsActive);

                    if (activeAdmins <= 1)
                    {
                        _logger.Warning($"Попытка снять роль Admin у последнего администратора {user.Email}");
                        return ServiceResult.BadRequest("Нельзя снять роль администратора у последнего активного админа");
                    }
                }

                string? currentRole = (await _userManager.GetRolesAsync(user)).FirstOrDefault();
                if (isOwnProfile && (dto.IsActive != user.IsActive || dto.Role != currentRole))
                {
                    _logger.Warning($"Пользователь {currentUserId} попытался изменить свой статус или роль");
                    return ServiceResult.Forbidden("Вы не можете изменить свой статус или роль");
                }

                bool wasActive = user.IsActive;

                if (wasActive && !user.IsActive)
                {
                    await _userManager.UpdateSecurityStampAsync(user);
                    _logger.Info($"Пользователь {user.Email} заблокирован, все сессии аннулированы");
                }

                IList<string> currentRoles = await _userManager.GetRolesAsync(user);
                await _userManager.RemoveFromRolesAsync(user, currentRoles);
                await _userManager.AddToRoleAsync(user, dto.Role);
            }

            IdentityResult updateResult = await _userManager.UpdateAsync(user);
            if (!updateResult.Succeeded)
            {
                var errors = string.Join(", ", updateResult.Errors.Select(e => e.Description));
                return ServiceResult.BadRequest($"Ошибка обновления: {errors}");
            }

            _logger.Info($"Пользователь {currentUserId} изменил данные профиля");
            return ServiceResult.Ok("Данные успешно обновлены");
        }
        catch (Exception ex)
        {
            _logger.Error($"Ошибка обновления пользователя {id}: {ex.Message}");
            return ServiceResult.InternalError("Ошибка обновления пользователя");
        }
    }

    public async Task<ServiceResult> DeleteUserAsync(int id, ClaimsPrincipal currentUser)
    {
        try
        {
            string? userIdStr = _userManager.GetUserId(currentUser);
            if (string.IsNullOrEmpty(userIdStr))
                return ServiceResult.Unauthorized("Не удалось определить пользователя");

            int currentUserId = int.Parse(userIdStr);
            if (currentUserId == id)
                return ServiceResult.Forbidden("Вы не можете удалить самого себя");

            User? user = await _userManager.FindByIdAsync(id.ToString());
            if (user == null)
                return ServiceResult.NotFound("Пользователь не найден");

            bool isAdmin = await _userManager.IsInRoleAsync(user, "Admin");
            if (isAdmin)
            {
                IList<User> admins = await _userManager.GetUsersInRoleAsync("Admin");
                if (admins.Count <= 1)
                    return ServiceResult.Conflict("Нельзя удалить последнего администратора");
            }

            _fileStorage.DeleteFile(user.AvatarPath);
            await _userManager.DeleteAsync(user);
            _logger.Info($"Пользователь {user.Email} удалён");
            return ServiceResult.Ok("Пользователь успешно удален");
        }
        catch (Exception ex)
        {
            _logger.Error($"Ошибка удаления пользователя {id}: {ex.Message}");
            return ServiceResult.InternalError("Ошибка удаления пользователя");
        }
    }

    public async Task<ServiceResult> UpdateAvatarAsync(int userId, IFormFile avatar, ClaimsPrincipal currentUser)
    {
        try
        {
            User? user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null)
                return ServiceResult.NotFound("Пользователь не найден");

            string? userIdStr = _userManager.GetUserId(currentUser);
            if (string.IsNullOrEmpty(userIdStr))
                return ServiceResult.Unauthorized("Не удалось определить пользователя");

            int currentUserId = int.Parse(userIdStr);
            if (currentUserId != userId && !currentUser.IsInRole("Admin"))
                return ServiceResult.Forbidden("У вас нет прав на изменение аватара этого пользователя");

            if (avatar == null || avatar.Length == 0)
                return ServiceResult.BadRequest("Файл не выбран");

            _fileStorage.DeleteFile(user.AvatarPath);

            try
            {
                string prefix = $"{userId}_";
                user.AvatarPath = await _fileStorage.SaveFileAsync(avatar, avatarsFolder, imageExtensions, prefix);
            }
            catch (InvalidOperationException ex)
            {
                return ServiceResult.BadRequest(ex.Message);
            }

            await _userManager.UpdateAsync(user);
            _logger.Info($"Пользователь {userId} обновил аватар");

            return ServiceResult.Ok("Аватар успешно загружен");
        }
        catch (Exception ex)
        {
            _logger.Error($"Ошибка загрузки аватара для пользователя {userId}: {ex.Message}");
            return ServiceResult.InternalError("Ошибка загрузки аватара");
        }
    }

    public async Task<ServiceResult> DeleteAvatarAsync(int userId, ClaimsPrincipal currentUser)
    {
        try
        {
            User? user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null)
                return ServiceResult.NotFound("Пользователь не найден");

            string? userIdStr = _userManager.GetUserId(currentUser);
            if (string.IsNullOrEmpty(userIdStr))
                return ServiceResult.Unauthorized("Не удалось определить пользователя");

            int currentUserId = int.Parse(userIdStr);
            if (currentUserId != userId && !currentUser.IsInRole("Admin") && !currentUser.IsInRole("Leader"))
                return ServiceResult.Forbidden("У вас нет прав на удаление аватара этого пользователя");

            _fileStorage.DeleteFile(user.AvatarPath);
            user.AvatarPath = null;
            await _userManager.UpdateAsync(user);

            _logger.Info($"Пользователь {userId} удалил аватар");
            return ServiceResult.Ok("Аватар успешно удален");
        }
        catch (Exception ex)
        {
            _logger.Error($"Ошибка удаления аватара пользователя {userId}: {ex.Message}");
            return ServiceResult.InternalError("Ошибка удаления аватара");
        }
    }

    public async Task<ServiceResult> ResetPasswordAsync(int userId, string newPassword, ClaimsPrincipal currentUser)
    {
        try
        {
            if (!currentUser.IsInRole("Admin"))
                return ServiceResult.Forbidden("Только администратор может сбросить пароль");

            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null)
                return ServiceResult.NotFound("Пользователь не найден");

            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            var result = await _userManager.ResetPasswordAsync(user, token, newPassword);
            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                _logger.Warning($"Ошибка сброса пароля для {userId}: {errors}");
                return ServiceResult.BadRequest($"Ошибка: {errors}");
            }

            _logger.Info($"Пароль сброшен для {userId} администратором {_userManager.GetUserId(currentUser)}");
            return ServiceResult.Ok("Пароль успешно изменён");
        }
        catch (Exception ex)
        {
            _logger.Error($"Ошибка сброса пароля {userId}: {ex.Message}");
            return ServiceResult.InternalError("Ошибка сброса пароля");
        }
    }
}