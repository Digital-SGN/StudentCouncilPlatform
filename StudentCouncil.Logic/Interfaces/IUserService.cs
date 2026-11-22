using Microsoft.AspNetCore.Http;
using StudentCouncil.Logic.DTOs;
using System.Security.Claims;

namespace StudentCouncil.Logic.Interfaces;

public interface IUserService
{
    /// <summary>Возвращает список всех пользователей.</summary>
    /// <param name="currentUser">Аутентифицированный пользователь.</param>
    Task<UserListResponseDTO> GetAllUsersAsync(ClaimsPrincipal currentUser);

    /// <summary>Возвращает пользователя по идентификатору.</summary>
    /// <param name="id">ID пользователя.</param>
    /// <param name="currentUser">Аутентифицированный пользователь.</param>
    Task<UserDTO> GetUserByIdAsync(int id, ClaimsPrincipal currentUser);

    /// <summary>Создаёт пользователя, назначает ему роль и задаёт пароль.</summary>
    /// <param name="dto">Данные создаваемого пользователя.</param>
    /// <param name="password">Пароль нового пользователя.</param>
    Task CreateUserAsync(CreateUserDTO dto, string password);

    /// <summary>Обновляет профиль и доступные администратору поля пользователя.</summary>
    /// <param name="id">ID обновляемого пользователя.</param>
    /// <param name="dto">Новые данные профиля.</param>
    /// <param name="currentUser">Аутентифицированный пользователь.</param>
    Task UpdateUserAsync(int id, UpdateUserDTO dto, ClaimsPrincipal currentUser);

    /// <summary>Удаляет пользователя, если он не является защищенным последним активным администратором.</summary>
    /// <param name="userId">ID удаляемого пользователя.</param>
    /// <param name="currentUser">Аутентифицированный пользователь.</param>
    Task DeleteUserAsync(int userId, ClaimsPrincipal currentUser);

    /// <summary>Загружает или заменяет аватар пользователя.</summary>
    Task UpdateAvatarAsync(int userId, IFormFile avatar, ClaimsPrincipal currentUser);

    /// <summary>Удаляет аватар пользователя.</summary>
    Task DeleteAvatarAsync(int userId, ClaimsPrincipal currentUser);

    /// <summary>Сбрасывает пароль указанного пользователя от имени администратора.</summary>
    /// <param name="userId">ID пользователя.</param>
    /// <param name="newPassword">Новый пароль.</param>
    /// <param name="currentUser">Аутентифицированный администратор.</param>
    Task ResetPasswordAsync(int userId, string newPassword, ClaimsPrincipal currentUser);
}