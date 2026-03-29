using Microsoft.AspNetCore.Http;
using StudentCouncil.Logic.DTOs.UsersDTOs;
using System.Security.Claims;
using static StudentCouncil.Logic.Services.UserService;

namespace StudentCouncil.Logic.Interfaces;

public interface IUserService
{
    Task<List<UserDTO>>? GetAllUsersWithRolesAsync();
    Task<UserDTO?> GetUserByIdAsync(int id);
    Task<(UserDTO? User, ProfileAccessResult Result)> GetUserProfileAsync(int id, ClaimsPrincipal currentUser);
    Task<bool> CreateUserAsync(CreateUserDTO dto, string password);
    Task<bool> UpdateUserAsync(int id, UpdateUserDTO dto, ClaimsPrincipal currentUser);
    Task<bool> DeleteUserAsync(int id, ClaimsPrincipal currentUser);
    Task<bool> UpdateAvatarAsync(int userId, IFormFile avatar, ClaimsPrincipal currentUser);
    Task<bool> DeleteAvatarAsync(int userId, ClaimsPrincipal currentUser);
}