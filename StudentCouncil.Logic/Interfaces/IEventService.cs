using StudentCouncil.Logic.DTOs;
using StudentCouncil.Logic.Services;

namespace StudentCouncil.Logic.Interfaces;

public interface IEventService
{
    Task<ServiceResult<EventListResponseDTO>> GetAllEventsAsync();
    Task<ServiceResult<EventResponseDTO>> GetEventByIdAsync(int id);
    Task<ServiceResult<EventResponseDTO>> CreateEventAsync(CreateEventDTO dto, int currentUserId);
    Task<ServiceResult<EventResponseDTO>> UpdateEventAsync(int id, UpdateEventDTO dto, int currentUserId);
    Task<ServiceResult> DeleteEventAsync(int id, int currentUserId);
}