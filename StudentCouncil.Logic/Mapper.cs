using StudentCouncil.Data.Models;
using StudentCouncil.Logic.DTOs;

namespace StudentCouncil.Logic;

public static class Mapper
{
    public static UserDTO ToUserDTO(User user, string role)
    {
        return new UserDTO
        {
            Id = user.Id,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Patronymic = user.Patronymic,
            Group = user.Group,
            Email = user.Email ?? string.Empty,
            PhoneNumber = user.PhoneNumber,
            Telegram = user.Telegram,
            ClothingSize = user.ClothingSize,
            BirthDate = user.BirthDate,
            JoinedAt = user.JoinedAt,
            IsActive = user.IsActive,
            AvatarPath = user.AvatarPath,
            Balance = user.Balance,
            ExperiencePoints = user.ExperiencePoints,
            Level = user.Level,
            EventsAttended = user.EventsAttended,
            EventsOrganized = user.EventsOrganized,
            TasksCompleted = user.TasksCompleted,
            Role = role
        };
    }

    public static User ToUserEntity(CreateUserDTO dto)
    {
        return new User
        {
            UserName = dto.Email,
            Email = dto.Email,
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            Patronymic = dto.Patronymic ?? string.Empty,
            Group = dto.Group,
            PhoneNumber = dto.PhoneNumber,
            Telegram = dto.Telegram,
            ClothingSize = dto.ClothingSize,
            BirthDate = dto.BirthDate.HasValue ? DateTime.SpecifyKind(dto.BirthDate.Value, DateTimeKind.Utc) : null,
            JoinedAt = DateTime.UtcNow,
            IsActive = true,
            Balance = 0,
            ExperiencePoints = 0,
            Level = 1,
            EventsAttended = 0,
            EventsOrganized = 0,
            TasksCompleted = 0
        };
    }

    public static void UpdateUserEntity(User user, UpdateUserDTO dto, bool isAdminOrLeader)
    {
        user.FirstName = dto.FirstName;
        user.LastName = dto.LastName;
        user.Patronymic = dto.Patronymic ?? string.Empty;
        user.Group = dto.Group;
        user.PhoneNumber = dto.PhoneNumber;
        user.Telegram = dto.Telegram;
        user.ClothingSize = dto.ClothingSize;
        user.BirthDate = dto.BirthDate.HasValue ? DateTime.SpecifyKind(dto.BirthDate.Value, DateTimeKind.Utc) : null;

        if (isAdminOrLeader)
        {
            user.IsActive = dto.IsActive;
            user.JoinedAt = dto.JoinedAt.ToUniversalTime();
            user.Balance = dto.Balance;
            user.ExperiencePoints = dto.ExperiencePoints;
            user.Level = (dto.ExperiencePoints / 250) + 1;
        }
    }

    public static EventResponseDTO ToEventDTO(Event ev)
    {
        return new EventResponseDTO
        {
            Id = ev.Id,
            Title = ev.Title,
            Description = ev.Description,
            Budget = ev.Budget,
            EventDate = ev.EventDate,
            Location = ev.Location,
            RegistrationLink = ev.RegistrationLink,
            Status = ev.Status,
            ResponsibleUserId = ev.ResponsibleUserId,
            CreatedAt = ev.CreatedAt
        };
    }

    public static Event ToEventEntity(CreateEventDTO dto)
    {
        return new Event
        {
            Title = dto.Title,
            Description = dto.Description,
            Budget = dto.Budget,
            EventDate = dto.EventDate.ToUniversalTime(),
            Location = dto.Location,
            RegistrationLink = dto.RegistrationLink,
            ResponsibleUserId = dto.ResponsibleUserId,
            CreatedAt = DateTime.UtcNow,
            IsDeleted = false,
            Status = EventStatus.Upcoming
        };
    }

    public static void UpdateEventEntity(Event ev, UpdateEventDTO dto)
    {
        ev.Title = dto.Title;
        ev.Description = dto.Description;
        ev.Budget = dto.Budget;
        ev.EventDate = dto.EventDate.ToUniversalTime();
        ev.Location = dto.Location;
        ev.RegistrationLink = dto.RegistrationLink;
        ev.Status = dto.Status;
        ev.ResponsibleUserId = dto.ResponsibleUserId;
    }


    public static BadgeResponseDTO ToBadgeDTO(Badge badge)
    {
        return new BadgeResponseDTO
        {
            Id = badge.Id,
            UserId = badge.UserId,
            UserName = badge.User != null ? $"{badge.User.LastName} {badge.User.FirstName}" : "—",
            EventId = badge.EventId,
            EventTitle = badge.Event?.Title ?? "—",
            Role = badge.Role,
            FilePath = badge.FilePath ?? string.Empty,
            CreatedAt = badge.CreatedAt
        };
    }

    public static Badge ToBadgeEntity(CreateBadgeDTO dto, string filePath)
    {
        return new Badge
        {
            UserId = dto.UserId,
            EventId = dto.EventId,
            Role = dto.Role,
            FilePath = filePath,
            CreatedAt = DateTime.UtcNow
        };
    }

    public static void UpdateBadgeEntity(Badge badge, UpdateBadgeDTO dto)
    {
        badge.Role = dto.Role;
    }
}