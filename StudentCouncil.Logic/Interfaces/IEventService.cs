using Microsoft.AspNetCore.Http;
using StudentCouncil.Logic.DTOs;
using StudentCouncil.Logic.Services;
using System.Security.Claims;

namespace StudentCouncil.Logic.Interfaces;

public interface IEventService
{
    Task<ServiceResult<EventListResponseDTO>> GetAllEventsAsync();
    Task<ServiceResult<EventResponseDTO>> GetEventByIdAsync(int id);
    Task<ServiceResult<EventResponseDTO>> CreateEventAsync(CreateEventDTO dto, ClaimsPrincipal currentUser);
    Task<ServiceResult> UpdateEventAsync(int id, UpdateEventDTO dto, ClaimsPrincipal currentUser);
    Task<ServiceResult> DeleteEventAsync(int id, ClaimsPrincipal currentUser);
    Task<ServiceResult> UpdateEventPhotoAsync(int id, IFormFile photo, ClaimsPrincipal currentUser);
    Task<ServiceResult> DeleteEventPhotoAsync(int id, ClaimsPrincipal currentUser);
}