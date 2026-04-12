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

    public EventController(IEventService eventService, LoggerService logger) : base(logger)
    {
        _eventService = eventService;
    }

    [HttpGet]
    [Authorize(Roles = "Admin,Leader")]
    public async Task<IActionResult> GetAllAsync()
    {
        return HandleServiceResult(await _eventService.GetAllEventsAsync());
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
        int currentUserId = GetCurrentUserId();

        ServiceResult result = await _eventService.CreateEventAsync(dto, currentUserId);
        return HandleServiceResult(result);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateAsync(int id, [FromBody] UpdateEventDTO dto)
    {
        int currentUserId = GetCurrentUserId();

        ServiceResult result = await _eventService.UpdateEventAsync(id, dto, currentUserId);
        return HandleServiceResult(result);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteAsync(int id)
    {
        int currentUserId = GetCurrentUserId();

        ServiceResult result = await _eventService.DeleteEventAsync(id, currentUserId);
        return HandleServiceResult(result);
    }
}
