using Microsoft.AspNetCore.Http;
using StudentCouncil.Logic.DTOs;
using System.Security.Claims;

namespace StudentCouncil.Logic.Interfaces;

public interface IUserService
{
    Task<UserListResponseDTO> GetAllUsersAsync();
    Task<UserDTO> GetUserByIdAsync(int id, ClaimsPrincipal currentUser);
    Task CreateUserAsync(CreateUserDTO dto, string password);
    Task UpdateUserAsync(int id, UpdateUserDTO dto, ClaimsPrincipal currentUser);
    Task DeleteUserAsync(int id, ClaimsPrincipal currentUser);
    Task UpdateAvatarAsync(int userId, IFormFile avatar, ClaimsPrincipal currentUser);
    Task DeleteAvatarAsync(int userId, ClaimsPrincipal currentUser);
    Task ResetPasswordAsync(int userId, string newPassword, ClaimsPrincipal currentUser);
}