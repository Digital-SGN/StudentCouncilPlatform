using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using StudentCouncil.Data;
using StudentCouncil.Data.Models;
using StudentCouncil.Logic.DTOs;
using StudentCouncil.Logic.Exceptions;
using StudentCouncil.Logic.Extensions;
using StudentCouncil.Logic.Interfaces;
using StudentCouncil.Logic.Mapping;
using System.Security.Claims;

namespace StudentCouncil.Logic.Services;

public class EventService : IEventService
{
    private readonly AppDbContext _context;
    private readonly IFileStorageService _fileStorage;
    private readonly ILogger<EventService> _logger;

    public const string eventsFolder = "event-images";
    public static readonly string[] imageExtensions = { ".jpg", ".jpeg", ".png", ".gif" };

    public EventService(AppDbContext context, IFileStorageService fileStorage, ILogger<EventService> logger)
    {
        _context = context;
        _fileStorage = fileStorage;
        _logger = logger;
    }

    public async Task<EventListResponseDTO> GetAllEventsAsync()
    {
        List<Event> events = await _context.Events
            .Where(e => !e.IsDeleted)
            .ToListAsync();

        List<EventResponseDTO> eventDtos = [.. events.Select(Mapper.ToEventDTO)];

        return new EventListResponseDTO
        {
            Count = eventDtos.Count,
            Events = eventDtos
        };
    }

    public async Task<EventResponseDTO> GetEventByIdAsync(int id)
    {
        Event? ev = await _context.Events
            .Where(e => !e.IsDeleted)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (ev == null)
            throw new NotFoundException("Мероприятие не найдено");

        return Mapper.ToEventDTO(ev);
    }

    public async Task<EventResponseDTO> CreateEventAsync(CreateEventDTO dto, ClaimsPrincipal currentUser)
    {
        if (!currentUser.IsAdmin())
            throw new ForbiddenException("Только администратор может создавать мероприятия");

        int currentUserId = currentUser.GetUserId();

        User? responsibleUser = await _context.Users.FindAsync(dto.ResponsibleUserId);
        if (responsibleUser == null)
        {
            _logger.LogWarning("Попытка создать мероприятие с несуществующим ответственным {ResponsibleUserId}",
                dto.ResponsibleUserId);
            throw new NotFoundException("Ответственный пользователь не найден");
        }

        Event ev = Mapper.ToEventEntity(dto);

        _context.Events.Add(ev);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Мероприятие {Title} создано пользователем {CurrentUserId}",
            ev.Title, currentUserId);

        return Mapper.ToEventDTO(ev);
    }

    public async Task UpdateEventAsync(int id, UpdateEventDTO dto, ClaimsPrincipal currentUser)
    {
        if (!currentUser.IsAdmin())
            throw new ForbiddenException("Только администратор может редактировать мероприятия");

        int currentUserId = currentUser.GetUserId();

        Event? ev = await _context.Events
            .Where(e => !e.IsDeleted)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (ev == null)
            throw new NotFoundException("Мероприятие не найдено");

        if (ev.ResponsibleUserId != dto.ResponsibleUserId)
        {
            User? responsibleUser = await _context.Users.FindAsync(dto.ResponsibleUserId);
            if (responsibleUser == null)
            {
                _logger.LogWarning("Попытка обновить мероприятие с несуществующим ответственным {ResponsibleUserId}",
                    dto.ResponsibleUserId);
                throw new NotFoundException("Ответственный пользователь не найден");
            }
        }

        Mapper.UpdateEventEntity(ev, dto);

        await _context.SaveChangesAsync();

        _logger.LogInformation("Мероприятие {Title} обновлено пользователем {CurrentUserId}",
            ev.Title, currentUserId);
    }

    public async Task DeleteEventAsync(int id, ClaimsPrincipal currentUser)
    {
        if (!currentUser.IsAdmin())
            throw new ForbiddenException("Только администратор может удалять мероприятия");

        int currentUserId = currentUser.GetUserId();

        Event? ev = await _context.Events
            .Where(e => !e.IsDeleted)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (ev == null)
        {
            _logger.LogWarning("Попытка удалить несуществующее мероприятие {EventId}", id);
            throw new NotFoundException("Мероприятие не найдено");
        }

        ev.IsDeleted = true;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Мероприятие {Title} (ID: {EventId}) помечено как удалённое пользователем {CurrentUserId}",
            ev.Title, id, currentUserId);
    }

    public async Task UpdateEventPhotoAsync(int id, IFormFile photo, ClaimsPrincipal currentUser)
    {
        if (!currentUser.IsAdmin())
            throw new ForbiddenException("Только администратор может изменять фото мероприятия");

        int currentUserId = currentUser.GetUserId();

        Event? ev = await _context.Events
            .Where(e => !e.IsDeleted)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (ev == null)
            throw new NotFoundException("Мероприятие не найдено");

        if (photo == null || photo.Length == 0)
            throw new BadRequestException("Файл не выбран");

        string? oldPhotoPath = ev.PhotoPath;

        string newPhotoPath;
        try
        {
            string prefix = $"{id}_";
            newPhotoPath = await _fileStorage.SaveFileAsync(photo, eventsFolder, imageExtensions, prefix);
        }
        catch (InvalidOperationException ex)
        {
            throw new BadRequestException(ex.Message);
        }

        ev.PhotoPath = newPhotoPath;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch
        {
            _fileStorage.DeleteFile(newPhotoPath);
            ev.PhotoPath = oldPhotoPath;
            throw;
        }

        if (!string.IsNullOrEmpty(oldPhotoPath))
            _fileStorage.DeleteFile(oldPhotoPath);

        _logger.LogInformation("Фото мероприятия {EventId} обновлено пользователем {CurrentUserId}",
            id, currentUserId);
    }

    public async Task DeleteEventPhotoAsync(int id, ClaimsPrincipal currentUser)
    {
        if (!currentUser.IsAdmin())
            throw new ForbiddenException("Только администратор может удалять фото мероприятия");

        int currentUserId = currentUser.GetUserId();

        Event? ev = await _context.Events
            .Where(e => !e.IsDeleted)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (ev == null)
            throw new NotFoundException("Мероприятие не найдено");

        _fileStorage.DeleteFile(ev.PhotoPath);
        ev.PhotoPath = null;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Фото мероприятия {EventId} удалено пользователем {CurrentUserId}",
            id, currentUserId);
    }
}