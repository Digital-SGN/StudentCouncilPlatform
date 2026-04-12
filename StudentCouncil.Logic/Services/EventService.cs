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

        public async Task<ServiceResult<EventListResponseDTO>> GetAllEventsAsync()
        {
            try
            {
                IQueryable<Event> query = _context.Events.Include(e => e.ResponsibleUser).AsQueryable();
                int count = await query.CountAsync();
                List<Event> events = await query.ToListAsync();
                List<EventResponseDTO> eventDtos = [.. events.Select(Mapper.ToEventDTO)];

                return ServiceResult<EventListResponseDTO>.Ok(new EventListResponseDTO
                {
                    Count = count,
                    Events = eventDtos
                });
            }
            catch (Exception ex)
            {
                _logger.Error($"Ошибка получения списка мероприятий: {ex.Message}");
                return ServiceResult<EventListResponseDTO>.InternalError("Ошибка получения списка мероприятий");
            }
        }

        public async Task<ServiceResult<EventResponseDTO>> GetEventByIdAsync(int id)
        {
            try
            {
                Event? ev = await _context.Events.Include(e => e.ResponsibleUser).FirstOrDefaultAsync(e => e.Id == id);
                if (ev == null)
                    return ServiceResult<EventResponseDTO>.NotFound("Мероприятие не найдено");

                return ServiceResult<EventResponseDTO>.Ok(Mapper.ToEventDTO(ev));
            }
            catch (Exception ex)
            {
                _logger.Error($"Ошибка получения мероприятия {id}: {ex.Message}");
                return ServiceResult<EventResponseDTO>.InternalError("Ошибка получения мероприятия");
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
                    return ServiceResult.NotFound("Ответственный пользователь не найден");
                }

                Event ev = Mapper.ToEventEntity(dto);

                _context.Events.Add(ev);
                await _context.SaveChangesAsync();
                _logger.Info($"Мероприятие '{ev.Title}' создано пользователем {currentUserId}");

                return ServiceResult.Created("Мероприятие успешно создано");
            }
            catch (Exception ex)
            {
                _logger.Error($"Ошибка создания мероприятия: {ex.Message}");
                return ServiceResult.InternalError("Ошибка создания мероприятия");
            }
        }

        public async Task<ServiceResult> UpdateEventAsync(int id, UpdateEventDTO dto, int currentUserId)
        {
            try
            {
                Event? ev = await _context.Events.FindAsync(id);
                if (ev == null)
                    return ServiceResult.NotFound("Мероприятие не найдено");

                if (ev.ResponsibleUserId != dto.ResponsibleUserId)
                {
                    User? responsibleUser = await _context.Users.FindAsync(dto.ResponsibleUserId);
                    if (responsibleUser == null)
                    {
                        _logger.Warning($"Попытка обновить мероприятие с несуществующим ответственным {dto.ResponsibleUserId}");
                        return ServiceResult.NotFound("Ответственный пользователь не найден");
                    }
                }

                Mapper.UpdateEventEntity(ev, dto);

                await _context.SaveChangesAsync();
                _logger.Info($"Мероприятие '{ev.Title}' обновлено пользователем {currentUserId}");

                return ServiceResult.Ok("Мероприятие успешно обновлено");
            }
            catch (Exception ex)
            {
                _logger.Error($"Ошибка обновления мероприятия {id}: {ex.Message}");
                return ServiceResult.InternalError("Ошибка обновления мероприятия");
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
                    return ServiceResult.NotFound("Мероприятие не найдено");
                }

                _context.Events.Remove(ev);
                await _context.SaveChangesAsync();
                _logger.Info($"Мероприятие '{ev.Title}' (ID: {id}) удалено пользователем {currentUserId}");
                return ServiceResult.Ok("Мероприятие успешно удалено");
            }
            catch (Exception ex)
            {
                _logger.Error($"Ошибка удаления мероприятия {id}: {ex.Message}");
                return ServiceResult.InternalError("Ошибка удаления мероприятия");
            }
        }
    }
}
