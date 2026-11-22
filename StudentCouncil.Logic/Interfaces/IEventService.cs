using Microsoft.AspNetCore.Http;
using StudentCouncil.Logic.DTOs;
using System.Security.Claims;

namespace StudentCouncil.Logic.Interfaces;

public interface IEventService
{
    /// <summary>Возвращает все мероприятия, доступные для аутентифицированного пользователя.</summary>
    Task<EventListResponseDTO> GetAllEventsAsync();

    /// <summary>Возвращает предстоящие мероприятия для публичного списка.</summary>
    Task<PublicEventListResponseDTO> GetPublicEventsAsync();

    /// <summary>Возвращает мероприятие по идентификатору.</summary>
    /// <param name="id">ID мероприятия.</param>
    Task<EventResponseDTO> GetEventByIdAsync(int id);

    /// <summary>Создаёт мероприятие от имени пользователя с правом администратора.</summary>
    Task<EventResponseDTO> CreateEventAsync(CreateEventDTO dto, ClaimsPrincipal currentUser);

    /// <summary>Обновляет данные мероприятия.</summary>
    Task UpdateEventAsync(int id, UpdateEventDTO dto, ClaimsPrincipal currentUser);

    /// <summary>Помечает мероприятие удалённым.</summary>
    Task DeleteEventAsync(int id, ClaimsPrincipal currentUser);

    /// <summary>Загружает или заменяет фотографию мероприятия.</summary>
    Task UpdateEventPhotoAsync(int id, IFormFile photo, ClaimsPrincipal currentUser);

    /// <summary>Удаляет фотографию мероприятия.</summary>
    Task DeleteEventPhotoAsync(int id, ClaimsPrincipal currentUser);
}