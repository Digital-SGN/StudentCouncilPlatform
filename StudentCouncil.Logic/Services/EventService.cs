using Microsoft.EntityFrameworkCore;
using StudentCouncil.Data;
using StudentCouncil.Data.Models;
using StudentCouncil.Logic.DTOs;
using StudentCouncil.Logic.Interfaces;

namespace StudentCouncil.Logic.Services
{
    public class EventService : IEventService
    {
        private readonly AppDbContext _context;
        private readonly LoggerService _logger;

        public EventService(AppDbContext context, LoggerService logger)
        {
            _context = context;
            _logger = logger;
        }
        private EventResponseDTO MapToDTO(Event ev)
        {
            return new EventResponseDTO
            {
                Id = ev.Id,
                Title = ev.Title,                     
                Description = ev.Description,         
                EventDate = ev.EventDate,
                Location = ev.Location,
                RegistrationLink = ev.RegistrationLink, 
                Status = ev.Status,
                ResponsibleUserId = ev.ResponsibleUserId, 
                CreatedAt = ev.CreatedAt
            };
        }

        public async Task<ServiceResult<EventListResponseDTO>> GetAllEventsAsync()
        {
            try
            {
                IQueryable<Event> query = _context.Events.Include(e => e.ResponsibleUser).AsQueryable();
                int count = await query.CountAsync();
                List<Event> events = await query.ToListAsync();
                List<EventResponseDTO> eventDtos = events.Select(MapToDTO).ToList();

                return ServiceResult<EventListResponseDTO>.Ok(new EventListResponseDTO
                {
                    Count = count,
                    Events = eventDtos
                });
            }
            catch (Exception ex)
            {
                _logger.Error($"Ошибка получения списка мероприятий: {ex.Message}");
                return ServiceResult<EventListResponseDTO>.Fail("Ошибка получения списка мероприятий", 500);
            }
        }

        public async Task<ServiceResult<EventResponseDTO>> GetEventByIdAsync(int id)
        {
            try
            {
                Event? ev = await _context.Events.Include(e => e.ResponsibleUser).FirstOrDefaultAsync(e => e.Id == id);
                if (ev == null)
                    return ServiceResult<EventResponseDTO>.Fail("Мероприятие не найдено", 404);

                return ServiceResult<EventResponseDTO>.Ok(MapToDTO(ev));
            }
            catch (Exception ex)
            {
                _logger.Error($"Ошибка получения мероприятия {id}: {ex.Message}");
                return ServiceResult<EventResponseDTO>.Fail("Ошибка получения мероприятия", 500);
            }
        }

        public async Task<ServiceResult> CreateEventAsync(CreateEventDTO dto, int currentUserId)
        {
            try
            {
                User? responsibleUser = await _context.Users.FindAsync(dto.ResponsibleUserId);
                if (responsibleUser == null)
                {
                    _logger.Warning($"Попытка создать мероприятие с несуществующим ответственным {dto.ResponsibleUserId}");
                    return ServiceResult<EventResponseDTO>.Fail("Ответственный пользователь не найден", 400);
                }

                var ev = new Event
                {
                    Title = dto.Title,
                    Description = dto.Description,
                    EventDate = dto.EventDate.ToUniversalTime(),
                    Location = dto.Location,
                    RegistrationLink = dto.RegistrationLink,
                    ResponsibleUserId = dto.ResponsibleUserId,
                    CreatedAt = DateTime.UtcNow,
                    IsDeleted = false,
                    Status = EventStatus.Upcoming
                };

                _context.Events.Add(ev);
                await _context.SaveChangesAsync();
                _logger.Info($"Мероприятие '{ev.Title}' создано пользователем {currentUserId}");

                return ServiceResult.Ok("Мероприятие успешно создано");
            }
            catch (Exception ex)
            {
                _logger.Error($"Ошибка создания мероприятия: {ex.Message}");
                return ServiceResult<EventResponseDTO>.Fail("Ошибка создания мероприятия", 500);
            }
        }

        public async Task<ServiceResult> UpdateEventAsync(int id, UpdateEventDTO dto, int currentUserId)
        {
            try
            {
                Event? ev = await _context.Events.FindAsync(id);
                if (ev == null)
                    return ServiceResult<EventResponseDTO>.Fail("Мероприятие не найдено", 404);

                if (ev.ResponsibleUserId != dto.ResponsibleUserId)
                {
                    User? responsibleUser = await _context.Users.FindAsync(dto.ResponsibleUserId);
                    if (responsibleUser == null)
                    {
                        _logger.Warning($"Попытка обновить мероприятие с несуществующим ответственным {dto.ResponsibleUserId}");
                        return ServiceResult.Fail("Ответственный пользователь не найден", 400);
                    }
                }

                ev.Title = dto.Title;
                ev.Description = dto.Description;
                ev.EventDate = dto.EventDate.ToUniversalTime();
                ev.Location = dto.Location;
                ev.RegistrationLink = dto.RegistrationLink;
                ev.Status = dto.Status;
                ev.ResponsibleUserId = dto.ResponsibleUserId;

                await _context.SaveChangesAsync();
                _logger.Info($"Мероприятие '{ev.Title}' обновлено пользователем {currentUserId}");

                return ServiceResult.Ok("Мероприятие успешно обновлено");
            }
            catch (Exception ex)
            {
                _logger.Error($"Ошибка обновления мероприятия {id}: {ex.Message}");
                return ServiceResult<EventResponseDTO>.Fail("Ошибка обновления мероприятия", 500);
            }
        }

        public async Task<ServiceResult> DeleteEventAsync(int id, int currentUserId)
        {
            try
            {
                Event? ev = await _context.Events.FindAsync(id);
                if (ev == null)
                {
                    _logger.Warning($"Попытка удалить несуществующее мероприятие {id}");
                    return ServiceResult.Fail("Мероприятие не найдено", 404);
                }

                _context.Events.Remove(ev);
                await _context.SaveChangesAsync();
                _logger.Info($"Мероприятие '{ev.Title}' (ID: {id}) удалено пользователем {currentUserId}");
                return ServiceResult.Ok("Мероприятие успешно удалено");
            }
            catch (Exception ex)
            {
                _logger.Error($"Ошибка удаления мероприятия {id}: {ex.Message}");
                return ServiceResult.Fail("Ошибка удаления мероприятия", 500);
            }
        }
    }
}
