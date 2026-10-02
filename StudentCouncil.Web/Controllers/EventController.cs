using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentCouncil.Logic.DTOs;
using StudentCouncil.Logic.Interfaces;

namespace StudentCouncil.Web.Controllers;

[ApiController]
[Route("api/events")]
public class EventController : BaseController
{
    private readonly IEventService _eventService;

    public EventController(IEventService eventService, ILoggerService logger) : base(logger)
    {
        _eventService = eventService;
    }

    [HttpGet]
    [Authorize(Roles = "Admin,Leader")]
    public async Task<IActionResult> GetAllAsync()
    {
        EventListResponseDTO result = await _eventService.GetAllEventsAsync();
        return Ok(result);
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "Admin,Leader")]
    public async Task<IActionResult> GetByIdAsync(int id)
    {
        EventResponseDTO result = await _eventService.GetEventByIdAsync(id);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateAsync([FromBody] CreateEventDTO dto)
    {
        EventResponseDTO result = await _eventService.CreateEventAsync(dto, User);
        return StatusCode(201, result);   
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateAsync(int id, [FromBody] UpdateEventDTO dto)
    {
        await _eventService.UpdateEventAsync(id, dto, User);
        return Ok(new { message = "Мероприятие успешно обновлено" });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteAsync(int id)
    {
        await _eventService.DeleteEventAsync(id, User);
        return Ok(new { message = "Мероприятие успешно удалено" });
    }

    [HttpPost("{id}/photo")]
    [Authorize(Roles = "Admin")]
    [RequestSizeLimit(10_485_760)]
    public async Task<IActionResult> UploadPhotoAsync(int id, IFormFile photo)
    {
        await _eventService.UpdateEventPhotoAsync(id, photo, User);
        return Ok(new { message = "Фото успешно загружено" });
    }

    [HttpDelete("{id}/photo")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeletePhotoAsync(int id)
    {
        await _eventService.DeleteEventPhotoAsync(id, User);
        return Ok(new { message = "Фото удалено" });
    }
}