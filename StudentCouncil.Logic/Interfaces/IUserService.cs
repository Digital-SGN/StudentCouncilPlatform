using Microsoft.AspNetCore.Http;
using StudentCouncil.Logic.DTOs;
using System.Security.Claims;
using static StudentCouncil.Logic.Services.UserService;

namespace StudentCouncil.Logic.Interfaces;

public interface IUserService
{
    Task<List<UserDto>> GetAllUsersWithRolesAsync();
    Task<UserDto?> GetUserByIdAsync(int id);
    Task<(UserDto? User, ProfileAccessResult Result)> GetUserProfileAsync(int id, ClaimsPrincipal currentUser);
    Task<bool> CreateUserAsync(CreateUserDto dto, string password);
    Task<bool> UpdateUserAsync(int id, UpdateUserDto dto, ClaimsPrincipal currentUser);
    Task<bool> DeleteUserAsync(int id, ClaimsPrincipal currentUser);
    Task<bool> UpdateAvatarAsync(int userId, IFormFile avatar, ClaimsPrincipal currentUser);
    Task<bool> DeleteAvatarAsync(int userId, ClaimsPrincipal currentUser);
}