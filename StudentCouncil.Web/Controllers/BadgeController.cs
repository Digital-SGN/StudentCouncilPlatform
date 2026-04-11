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

    public BadgeController(IBadgeService badgeService, LoggerService logger) : base(logger)
    {
        _badgeService = badgeService;
    }

    [HttpGet("user/{userId}")]
    public async Task<IActionResult> GetByUser(int userId)
    {
        
        int currentUserId = GetCurrentUserId();
        if (currentUserId != userId && !(User.IsInRole("Admin") || User.IsInRole("Leader")))
            return Forbid();

        ServiceResult<BadgeListResponseDTO> result = await _badgeService.GetBadgesByUserAsync(userId);
        return HandleServiceResult(result);
    }


    [HttpGet("event/{eventId}")]
    [Authorize(Roles = "Admin,Leader")]
    public async Task<IActionResult> GetByEvent(int eventId)
    {
        ServiceResult<BadgeListResponseDTO> result = await _badgeService.GetBadgesByEventAsync(eventId);
        return HandleServiceResult(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        ServiceResult<BadgeResponseDTO> result = await _badgeService.GetBadgeByIdAsync(id);
        return HandleServiceResult(result);
    }

    [HttpGet("{id}/download")]
    public async Task<IActionResult> Download(int id)
    {
        ServiceResult<(byte[] FileContent, string ContentType, string FileName)> result = await _badgeService.DownloadBadgeAsync(id);
        if (!result.Success)
            return HandleServiceResult(result);

        return File(result.Data.FileContent, result.Data.ContentType, result.Data.FileName);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromForm] CreateBadgeDTO dto, IFormFile? file)
    {
        if (!ModelState.IsValid)
            return BadRequest(new { errors = GetModelStateErrors() });

        int currentUserId = GetCurrentUserId();
        ServiceResult result = await _badgeService.CreateBadgeAsync(dto, file, currentUserId);
        return HandleServiceResult(result);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateBadgeDTO dto)
    {
        int currentUserId = GetCurrentUserId();
        ServiceResult result = await _badgeService.UpdateBadgeAsync(id, dto, currentUserId);
        return HandleServiceResult(result);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        int currentUserId = GetCurrentUserId();
        ServiceResult result = await _badgeService.DeleteBadgeAsync(id, currentUserId);
        return HandleServiceResult(result);
    }

    [HttpPost("{id}/upload")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UploadFile(int id, IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { error = "Файл не выбран" });

        var extension = Path.GetExtension(file.FileName).ToLower();
        if (extension != ".pdf")
            return BadRequest(new { error = "Допустимы только PDF файлы" });

        var result = await _badgeService.UploadBadgeFileAsync(id, file);
        return HandleServiceResult(result);
    }
}