using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentCouncil.Logic.DTOs;
using StudentCouncil.Logic.Interfaces;
using StudentCouncil.Logic.Services;

namespace StudentCouncil.Web.Controllers;

[ApiController]
[Route("api/badges")]
[Authorize]
public class BadgeController : BaseController
{
    private readonly IBadgeService _badgeService;

    public BadgeController(IBadgeService badgeService, ILoggerService logger) : base(logger)
    {
        _badgeService = badgeService;
    }

    [HttpGet("user/{userId}")]
    public async Task<IActionResult> GetByUser(int userId)
    {
        ServiceResult<BadgeListResponseDTO> result = await _badgeService.GetBadgesByUserAsync(userId, User);
        return HandleServiceResult(result);
    }


    [HttpGet("event/{eventId}")]
    [Authorize(Roles = "Admin,Leader")]
    public async Task<IActionResult> GetByEvent(int eventId)
    {
        ServiceResult<BadgeListResponseDTO> result = await _badgeService.GetBadgesByEventAsync(eventId, User);
        return HandleServiceResult(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        ServiceResult<BadgeResponseDTO> result = await _badgeService.GetBadgeByIdAsync(id, User);
        return HandleServiceResult(result);
    }

    [HttpGet("{id}/download")]
    public async Task<IActionResult> Download(int id)
    {
        ServiceResult<(byte[] FileContent, string ContentType, string FileName)> result = await _badgeService.DownloadBadgeAsync(id, User);
        if (!result.Success)
            return HandleServiceResult(result);
        return File(result.Data.FileContent, result.Data.ContentType, result.Data.FileName);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromForm] CreateBadgeDTO dto, IFormFile? file)
    {
        ServiceResult result = await _badgeService.CreateBadgeAsync(dto, file, User);
        return HandleServiceResult(result);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateBadgeDTO dto)
    {
        ServiceResult result = await _badgeService.UpdateBadgeAsync(id, dto, User);
        return HandleServiceResult(result);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        ServiceResult result = await _badgeService.DeleteBadgeAsync(id, User);
        return HandleServiceResult(result);
    }

    [HttpPost("{id}/upload")]
    [Authorize(Roles = "Admin")]
    [RequestSizeLimit(10_485_760)]
    public async Task<IActionResult> UploadFile(int id, IFormFile file)
    {
        ServiceResult result = await _badgeService.UploadBadgeFileAsync(id, file, User);
        return HandleServiceResult(result);
    }
}