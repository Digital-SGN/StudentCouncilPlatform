using StudentCouncil.Logic.DTOs;
using StudentCouncil.Logic.Services;
using System.Security.Claims;

namespace StudentCouncil.Logic.Interfaces;

public interface IEventService
{
    Task<ServiceResult<EventListResponseDTO>> GetAllEventsAsync();
    Task<ServiceResult<EventResponseDTO>> GetEventByIdAsync(int id);
    Task<ServiceResult> CreateEventAsync(CreateEventDTO dto, ClaimsPrincipal currentUser);
    Task<ServiceResult> UpdateEventAsync(int id, UpdateEventDTO dto, ClaimsPrincipal currentUser);
    Task<ServiceResult> DeleteEventAsync(int id, ClaimsPrincipal currentUser);
}