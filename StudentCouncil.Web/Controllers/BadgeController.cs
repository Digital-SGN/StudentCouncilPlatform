using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentCouncil.Logic.DTOs;
using StudentCouncil.Logic.Interfaces;

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

    [HttpGet("~/api/users/{userId}/badges")]
    public async Task<IActionResult> GetByUser(int userId)
    {
        BadgeListResponseDTO result = await _badgeService.GetBadgesByUserAsync(userId, User);
        return Ok(result);
    }

    [HttpGet("~/api/events/{eventId}/badges")]
    [Authorize(Roles = "Admin,Leader")]
    public async Task<IActionResult> GetByEvent(int eventId)
    {
        BadgeListResponseDTO result = await _badgeService.GetBadgesByEventAsync(eventId, User);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        BadgeResponseDTO result = await _badgeService.GetBadgeByIdAsync(id, User);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromForm] CreateBadgeDTO dto, IFormFile? file)
    {
        await _badgeService.CreateBadgeAsync(dto, file, User);
        return StatusCode(201, new { message = "Бейдж успешно создан" });
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateBadgeDTO dto)
    {
        await _badgeService.UpdateBadgeAsync(id, dto, User);
        return Ok(new { message = "Бейдж успешно обновлён" });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        await _badgeService.DeleteBadgeAsync(id, User);
        return Ok(new { message = "Бейдж успешно удалён" });
    }

    [HttpGet("{id}/file")]
    public async Task<IActionResult> DownloadBadgeFile(int id)
    {
        var (fileContent, contentType, fileName) = await _badgeService.DownloadBadgeAsync(id, User);
        return File(fileContent, contentType, fileName);
    }

    [HttpPost("{id}/file")]
    [Authorize(Roles = "Admin")]
    [RequestSizeLimit(10_485_760)]
    public async Task<IActionResult> UploadBadgeFile(int id, IFormFile file)
    {
        await _badgeService.UploadBadgeFileAsync(id, file, User);
        return Ok(new { message = "Файл успешно загружен" });
    }

    [HttpDelete("{id}/file")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteBadgeFile(int id)
    {
        await _badgeService.DeleteBadgeFileAsync(id, User);
        return Ok(new { message = "Файл бейджа успешно удалён" });
    }
}