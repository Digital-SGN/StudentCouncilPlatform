using Microsoft.AspNetCore.Http;
using StudentCouncil.Logic.DTOs;
using StudentCouncil.Logic.Services;
using System.Security.Claims;

namespace StudentCouncil.Logic.Interfaces;

public interface IBadgeService
{
    Task<ServiceResult<BadgeListResponseDTO>> GetBadgesByUserAsync(int userId, ClaimsPrincipal currentUser);
    Task<ServiceResult<BadgeListResponseDTO>> GetBadgesByEventAsync(int eventId, ClaimsPrincipal currentUser);
    Task<ServiceResult<BadgeResponseDTO>> GetBadgeByIdAsync(int id, ClaimsPrincipal currentUser);
    Task<ServiceResult> CreateBadgeAsync(CreateBadgeDTO dto, IFormFile? file, ClaimsPrincipal currentUser);
    Task<ServiceResult> UpdateBadgeAsync(int id, UpdateBadgeDTO dto, ClaimsPrincipal currentUser);
    Task<ServiceResult> DeleteBadgeAsync(int id, ClaimsPrincipal currentUser);
    Task<ServiceResult> UploadBadgeFileAsync(int id, IFormFile file, ClaimsPrincipal currentUser);
    Task<ServiceResult<(byte[] FileContent, string ContentType, string FileName)>> DownloadBadgeAsync(int id, ClaimsPrincipal currentUser);
}