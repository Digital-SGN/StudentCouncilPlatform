using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using StudentCouncil.Data.Models;
using StudentCouncil.Logic.DTOs;
using StudentCouncil.Logic.Exceptions;
using StudentCouncil.Logic.Interfaces;
using System.Security.Claims;

namespace StudentCouncil.Logic.Services;

public class UserService : IUserService
{
    private readonly UserManager<User> _userManager;
    private readonly IFileStorageService _fileStorage;
    private readonly ILoggerService _logger;

    public const string avatarsFolder = "avatars";
    public static readonly string[] imageExtensions = { ".jpg", ".jpeg", ".png", ".gif" };
    private static readonly HashSet<string> AllowedRoles = new(StringComparer.OrdinalIgnoreCase) { "Admin", "Leader", "Member" };

    public UserService(UserManager<User> userManager, IFileStorageService fileStorage, ILoggerService logger)
    {
        _userManager = userManager;
        _fileStorage = fileStorage;
        _logger = logger;
    }

    public async Task<UserListResponseDTO> GetAllUsersAsync()
    {
        List<User> users = await _userManager.Users.ToListAsync();
        List<UserDTO> result = new List<UserDTO>();

        foreach (User user in users)
        {
            IList<string> roles = await _userManager.GetRolesAsync(user);
            result.Add(Mapper.ToUserDTO(user, roles.FirstOrDefault() ?? "Member"));
        }

        return new UserListResponseDTO
        {
            Count = result.Count,
            Users = result
        };
    }

    public async Task<UserDTO> GetUserByIdAsync(int id, ClaimsPrincipal currentUser)
    {
        User? user = await _userManager.FindByIdAsync(id.ToString());
        if (user == null)
            throw new NotFoundException("Пользователь не найден");

        string? userIdStr = _userManager.GetUserId(currentUser);
        if (string.IsNullOrEmpty(userIdStr))
            throw new UnauthorizedException("Не удалось определить пользователя");

        int currentUserId = int.Parse(userIdStr);
        bool isAdminOrLeader = currentUser.IsInRole("Admin") || currentUser.IsInRole("Leader");
        bool isOwnProfile = currentUserId == user.Id;

        if (!isOwnProfile && !isAdminOrLeader)
            throw new ForbiddenException("У вас нет прав на просмотр этого профиля");

        IList<string> roles = await _userManager.GetRolesAsync(user);
        return Mapper.ToUserDTO(user, roles.FirstOrDefault() ?? "Member");
    }

    public async Task CreateUserAsync(CreateUserDTO dto, string password)
    {
        User? existingUser = await _userManager.FindByEmailAsync(dto.Email);
        if (existingUser != null)
            throw new ConflictException("Пользователь с таким email уже существует");

        string role = string.IsNullOrWhiteSpace(dto.Role) ? "Member" : dto.Role.Trim();
        if (!AllowedRoles.Contains(role))
            throw new BadRequestException($"Недопустимая роль. Разрешены: {string.Join(", ", AllowedRoles)}");

        User user = Mapper.ToUserEntity(dto);

        IdentityResult createResult = await _userManager.CreateAsync(user, password);
        if (!createResult.Succeeded)
        {
            string errors = string.Join(", ", createResult.Errors.Select(e => e.Description));
            _logger.Warning($"Ошибка создания {dto.Email}: {errors}");
            throw new BadRequestException($"Ошибка создания: {errors}");
        }

        IdentityResult roleResult = await _userManager.AddToRoleAsync(user, role);
        if (!roleResult.Succeeded)
        {
            await _userManager.DeleteAsync(user);
            string errors = string.Join(", ", roleResult.Errors.Select(e => e.Description));
            _logger.Warning($"Ошибка назначения роли '{role}' для {dto.Email}: {errors}");
            throw new BadRequestException($"Ошибка назначения роли: {errors}");
        }

        _logger.Info($"Создан пользователь {dto.Email} с ролью {role}");
    }

    public async Task UpdateUserAsync(int id, UpdateUserDTO dto, ClaimsPrincipal currentUser)
    {
        User? user = await _userManager.FindByIdAsync(id.ToString());

        if (user == null)
            throw new NotFoundException("Пользователь не найден");

        string? userIdStr = _userManager.GetUserId(currentUser);
        if (string.IsNullOrEmpty(userIdStr))
            throw new UnauthorizedException("Не удалось определить пользователя");

        int currentUserId = int.Parse(userIdStr);
        bool isAdmin = currentUser.IsInRole("Admin");
        bool isOwnProfile = currentUserId == user.Id;

        if (!isOwnProfile && !isAdmin)
        {
            _logger.Warning($"Пользователь {currentUserId} попытался редактировать чужой профиль {id}");
            throw new ForbiddenException("У вас нет прав на редактирование этого пользователя");
        }

        if (isAdmin && !isOwnProfile)
        {
            IList<string> currentRoles = await _userManager.GetRolesAsync(user);
            string currentRole = currentRoles.FirstOrDefault() ?? "Member";

            if (!string.IsNullOrEmpty(dto.Role)
                && dto.Role != "Admin" && dto.Role != "Leader" && dto.Role != "Member")
            {
                throw new BadRequestException("Недопустимая роль");
            }

            if (dto.IsActive == false && currentRole == "Admin")
            {
                IList<User> admins = await _userManager.GetUsersInRoleAsync("Admin");
                int activeAdmins = admins.Count(a => a.IsActive);
                if (activeAdmins <= 1)
                {
                    _logger.Warning($"Попытка заблокировать последнего активного администратора {user.Email}");
                    throw new ConflictException("Нельзя заблокировать последнего активного администратора");
                }
            }

            if (currentRole == "Admin" && !string.IsNullOrEmpty(dto.Role) && dto.Role != "Admin")
            {
                IList<User> admins = await _userManager.GetUsersInRoleAsync("Admin");
                int activeAdmins = admins.Count(a => a.IsActive);
                if (activeAdmins <= 1)
                {
                    _logger.Warning($"Попытка снять роль Admin у последнего администратора {user.Email}");
                    throw new BadRequestException("Нельзя снять роль администратора у последнего активного админа");
                }
            }

            if (!string.IsNullOrEmpty(dto.Email) && dto.Email != user.Email)
            {
                User? existingUser = await _userManager.FindByEmailAsync(dto.Email);
                if (existingUser != null && existingUser.Id != user.Id)
                    throw new ConflictException("Пользователь с таким email уже существует");
            }

            bool wasActive = user.IsActive;

            Mapper.UpdateUserEntity(user, dto, applyAdminFields: true);

            if (!string.IsNullOrEmpty(dto.Role) && dto.Role != currentRole)
            {
                await _userManager.RemoveFromRolesAsync(user, currentRoles);
                await _userManager.AddToRoleAsync(user, dto.Role);
            }

            if (wasActive && !user.IsActive)
            {
                await _userManager.UpdateSecurityStampAsync(user);
                _logger.Info($"Пользователь {user.Email} заблокирован, все сессии аннулированы");
            }
        }
        else
        {
            Mapper.UpdateUserEntity(user, dto, applyAdminFields: false);
        }

        IdentityResult updateResult = await _userManager.UpdateAsync(user);
        if (!updateResult.Succeeded)
        {
            string errors = string.Join(", ", updateResult.Errors.Select(e => e.Description));
            throw new BadRequestException($"Ошибка обновления: {errors}");
        }

        _logger.Info($"Пользователь {currentUserId} изменил профиль {id}");
    }

    public async Task DeleteUserAsync(int id, ClaimsPrincipal currentUser)
    {
        string? userIdStr = _userManager.GetUserId(currentUser);

        if (!currentUser.IsInRole("Admin"))
            throw new ForbiddenException("Доступ запрещен");

        if (string.IsNullOrEmpty(userIdStr))
            throw new UnauthorizedException("Не удалось определить пользователя");

        int currentUserId = int.Parse(userIdStr);
        if (currentUserId == id)
            throw new ForbiddenException("Вы не можете удалить самого себя");

        User? user = await _userManager.FindByIdAsync(id.ToString());
        if (user == null)
            throw new NotFoundException("Пользователь не найден");

        bool isAdmin = await _userManager.IsInRoleAsync(user, "Admin");
        if (isAdmin)
        {
            IList<User> admins = await _userManager.GetUsersInRoleAsync("Admin");
            if (admins.Count <= 1)
                throw new ConflictException("Нельзя удалить последнего администратора");
        }

        _fileStorage.DeleteFile(user.AvatarPath);

        try
        {
            await _userManager.DeleteAsync(user);
        }
        catch (Exception ex)
        {
            var pgEx = ex switch
            {
                Npgsql.PostgresException p => p,
                DbUpdateException dbEx => dbEx.InnerException as Npgsql.PostgresException,
                _ => ex.InnerException as Npgsql.PostgresException
            };

            if (pgEx is not null && pgEx.SqlState is "23001" or "23503")
            {
                if (pgEx.ConstraintName == "FK_Events_AspNetUsers_ResponsibleUserId")
                {
                    _logger.Warning($"Пользователь {id} не удалён: ответственный за мероприятия");
                    throw new ConflictException("Нельзя удалить пользователя: он назначен ответственным за мероприятия");
                }

                _logger.Warning($"Пользователь {id} не удалён: FK violation. Constraint: {pgEx.ConstraintName}");
                throw new ConflictException("Нельзя удалить: с пользователем связаны другие данные.");
            }

            throw;
        }

        _logger.Info($"Пользователь {user.Email} удалён");
    }

    public async Task UpdateAvatarAsync(int userId, IFormFile avatar, ClaimsPrincipal currentUser)
    {
        User? user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
            throw new NotFoundException("Пользователь не найден");

        string? userIdStr = _userManager.GetUserId(currentUser);
        if (string.IsNullOrEmpty(userIdStr))
            throw new UnauthorizedException("Не удалось определить пользователя");

        int currentUserId = int.Parse(userIdStr);
        if (currentUserId != userId && !currentUser.IsInRole("Admin"))
            throw new ForbiddenException("У вас нет прав на изменение аватара этого пользователя");

        if (avatar == null || avatar.Length == 0)
            throw new BadRequestException("Файл не выбран");

        string? oldAvatarPath = user.AvatarPath;

        string newAvatarPath;
        try
        {
            string prefix = $"{userId}_";
            newAvatarPath = await _fileStorage.SaveFileAsync(avatar, avatarsFolder, imageExtensions, prefix);
        }
        catch (InvalidOperationException ex)
        {
            throw new BadRequestException(ex.Message);
        }

        user.AvatarPath = newAvatarPath;
        IdentityResult updateResult = await _userManager.UpdateAsync(user);

        if (!updateResult.Succeeded)
        {
            _fileStorage.DeleteFile(newAvatarPath);
            string errors = string.Join(", ", updateResult.Errors.Select(e => e.Description));
            throw new BadRequestException($"Ошибка обновления аватара: {errors}");
        }

        if (!string.IsNullOrEmpty(oldAvatarPath))
            _fileStorage.DeleteFile(oldAvatarPath);

        _logger.Info($"Пользователь {userId} обновил аватар");
    }

    public async Task DeleteAvatarAsync(int userId, ClaimsPrincipal currentUser)
    {
        User? user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
            throw new NotFoundException("Пользователь не найден");

        string? userIdStr = _userManager.GetUserId(currentUser);
        if (string.IsNullOrEmpty(userIdStr))
            throw new UnauthorizedException("Не удалось определить пользователя");

        int currentUserId = int.Parse(userIdStr);
        if (currentUserId != userId && !currentUser.IsInRole("Admin") && !currentUser.IsInRole("Leader"))
            throw new ForbiddenException("У вас нет прав на удаление аватара этого пользователя");

        _fileStorage.DeleteFile(user.AvatarPath);
        user.AvatarPath = null;
        await _userManager.UpdateAsync(user);

        _logger.Info($"Пользователь {userId} удалил аватар");
    }

    public async Task ResetPasswordAsync(int userId, string newPassword, ClaimsPrincipal currentUser)
    {
        if (!currentUser.IsInRole("Admin"))
            throw new ForbiddenException("Только администратор может сбросить пароль");

        User? user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
            throw new NotFoundException("Пользователь не найден");

        string token = await _userManager.GeneratePasswordResetTokenAsync(user);
        IdentityResult result = await _userManager.ResetPasswordAsync(user, token, newPassword);
        if (!result.Succeeded)
        {
            string errors = string.Join(", ", result.Errors.Select(e => e.Description));
            _logger.Warning($"Ошибка сброса пароля для {userId}: {errors}");
            throw new BadRequestException($"Ошибка: {errors}");
        }

        _logger.Info($"Пароль сброшен для {userId} администратором {_userManager.GetUserId(currentUser)}");
    }
}