using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentCouncil.Logic.DTOs;
using StudentCouncil.Logic.Services;
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
        ServiceResult<EventListResponseDTO> result = await _eventService.GetAllEventsAsync();
        return HandleServiceResult(result);
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "Admin,Leader")]
    public async Task<IActionResult> GetByIdAsync(int id)
    {
        ServiceResult<EventResponseDTO> result = await _eventService.GetEventByIdAsync(id);
        return HandleServiceResult(result);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateAsync([FromBody] CreateEventDTO dto)
    {
        ServiceResult<EventResponseDTO> result = await _eventService.CreateEventAsync(dto, User);
        return HandleServiceResult(result);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateAsync(int id, [FromBody] UpdateEventDTO dto)
    {
        ServiceResult result = await _eventService.UpdateEventAsync(id, dto, User);
        return HandleServiceResult(result);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteAsync(int id)
    {
        ServiceResult result = await _eventService.DeleteEventAsync(id, User);
        return HandleServiceResult(result);
    }

    [HttpPost("{id}/photo")]
    [Authorize(Roles = "Admin")]
    [RequestSizeLimit(10_485_760)]
    public async Task<IActionResult> UploadPhotoAsync(int id, IFormFile photo)
    {
        ServiceResult result = await _eventService.UpdateEventPhotoAsync(id, photo, User);
        return HandleServiceResult(result);
    }

    [HttpDelete("{id}/photo")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeletePhotoAsync(int id)
    {
        ServiceResult result = await _eventService.DeleteEventPhotoAsync(id, User);
        return HandleServiceResult(result);
    }
}
