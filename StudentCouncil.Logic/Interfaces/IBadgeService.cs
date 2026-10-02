using Microsoft.AspNetCore.Http;
using StudentCouncil.Logic.DTOs;
using System.Security.Claims;

namespace StudentCouncil.Logic.Interfaces;

public interface IBadgeService
{
    Task<BadgeListResponseDTO> GetBadgesByUserAsync(int userId, ClaimsPrincipal currentUser);
    Task<BadgeListResponseDTO> GetBadgesByEventAsync(int eventId, ClaimsPrincipal currentUser);
    Task<BadgeResponseDTO> GetBadgeByIdAsync(int id, ClaimsPrincipal currentUser);
    Task CreateBadgeAsync(CreateBadgeDTO dto, IFormFile? file, ClaimsPrincipal currentUser);
    Task UpdateBadgeAsync(int id, UpdateBadgeDTO dto, ClaimsPrincipal currentUser);
    Task DeleteBadgeAsync(int id, ClaimsPrincipal currentUser);
    Task UploadBadgeFileAsync(int id, IFormFile file, ClaimsPrincipal currentUser);
    Task DeleteBadgeFileAsync(int id, ClaimsPrincipal currentUser);
    Task<(byte[] FileContent, string ContentType, string FileName)> DownloadBadgeAsync(int id, ClaimsPrincipal currentUser);
}