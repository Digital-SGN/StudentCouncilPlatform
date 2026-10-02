using Microsoft.AspNetCore.Http;
using StudentCouncil.Logic.DTOs;
using System.Security.Claims;

namespace StudentCouncil.Logic.Interfaces;

public interface IEventService
{
    Task<EventListResponseDTO> GetAllEventsAsync();
    Task<EventResponseDTO> GetEventByIdAsync(int id);
    Task<EventResponseDTO> CreateEventAsync(CreateEventDTO dto, ClaimsPrincipal currentUser);
    Task UpdateEventAsync(int id, UpdateEventDTO dto, ClaimsPrincipal currentUser);
    Task DeleteEventAsync(int id, ClaimsPrincipal currentUser);
    Task UpdateEventPhotoAsync(int id, IFormFile photo, ClaimsPrincipal currentUser);
    Task DeleteEventPhotoAsync(int id, ClaimsPrincipal currentUser);
}