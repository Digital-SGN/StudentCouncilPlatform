using Microsoft.AspNetCore.Http;
using StudentCouncil.Logic.DTOs;
using StudentCouncil.Logic.Services;

namespace StudentCouncil.Logic.Interfaces;

public interface IBadgeService
{
    Task<ServiceResult<BadgeListResponseDTO>> GetBadgesByUserAsync(int userId, int currentUserId, bool isAdminOrLeader);
    Task<ServiceResult<BadgeListResponseDTO>> GetBadgesByEventAsync(int eventId, int currentUserId, bool isAdminOrLeader);
    Task<ServiceResult<BadgeResponseDTO>> GetBadgeByIdAsync(int id, int currentUserId, bool isAdminOrLeader);
    Task<ServiceResult> CreateBadgeAsync(CreateBadgeDTO dto, IFormFile? file, int currentUserId);
    Task<ServiceResult> UpdateBadgeAsync(int id, UpdateBadgeDTO dto, int currentUserId);
    Task<ServiceResult> DeleteBadgeAsync(int id, int currentUserId);
    Task<ServiceResult> UploadBadgeFileAsync(int id, IFormFile file);
    Task<ServiceResult<(byte[] FileContent, string ContentType, string FileName)>> DownloadBadgeAsync(int id, int currentUserId, bool isAdminOrLeader);

}