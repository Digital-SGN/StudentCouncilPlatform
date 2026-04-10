using Microsoft.AspNetCore.Http;
using StudentCouncil.Logic.DTOs;
using StudentCouncil.Logic.Services;
using System.Security.Claims;

namespace StudentCouncil.Logic.Interfaces;

public interface IUserService
{
    Task<ServiceResult<List<UserDTO>>> GetAllUsersAsync();
    Task<ServiceResult<UserDTO>> GetUserByIdAsync(int id);
    Task<ServiceResult<UserDTO>> GetUserProfileAsync(int id, ClaimsPrincipal currentUser);
    Task<ServiceResult> CreateUserAsync(CreateUserDTO dto, string password);
    Task<ServiceResult> UpdateUserAsync(int id, UpdateUserDTO dto, ClaimsPrincipal currentUser);
    Task<ServiceResult> DeleteUserAsync(int id, ClaimsPrincipal currentUser);
    Task<ServiceResult> UpdateAvatarAsync(int userId, IFormFile avatar, ClaimsPrincipal currentUser);
    Task<ServiceResult> DeleteAvatarAsync(int userId, ClaimsPrincipal currentUser);
}