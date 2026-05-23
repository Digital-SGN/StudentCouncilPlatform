using Microsoft.AspNetCore.Http;
using StudentCouncil.Logic.DTOs;
using StudentCouncil.Logic.Services;
using System.Security.Claims;

namespace StudentCouncil.Logic.Interfaces;

public interface IUserService
{
    Task<ServiceResult<UserListResponseDTO>> GetAllUsersAsync();
    Task<ServiceResult<UserDTO>> GetUserByIdAsync(int id, ClaimsPrincipal currentUser);
    Task<ServiceResult> CreateUserAsync(CreateUserDTO dto, string password);
    Task<ServiceResult> UpdateUserAsync(int id, UpdateUserDTO dto, ClaimsPrincipal currentUser);
    Task<ServiceResult> DeleteUserAsync(int id, ClaimsPrincipal currentUser);
    Task<ServiceResult> UpdateAvatarAsync(int userId, IFormFile avatar, ClaimsPrincipal currentUser);
    Task<ServiceResult> DeleteAvatarAsync(int userId, ClaimsPrincipal currentUser);
    Task<ServiceResult> ResetPasswordAsync(int userId, string newPassword, ClaimsPrincipal currentUser);
}