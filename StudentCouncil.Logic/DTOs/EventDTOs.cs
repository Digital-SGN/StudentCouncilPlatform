using StudentCouncil.Data.Models;
using System.ComponentModel.DataAnnotations;

namespace StudentCouncil.Logic.DTOs
{
    public class CreateEventDTO
    {
        [Required, MaxLength(100)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(400)]
        public string Description { get; set; } = string.Empty;

        [Range(0, double.MaxValue)]
        public decimal? Budget { get; set; }

        [Required]
        public DateTime EventDate { get; set; }

        [Required, MaxLength(100)]
        public string Location { get; set; } = string.Empty;

        [Range(0, int.MaxValue)]
        public int RegisteredParticipants { get; set; }

        [Range(0, int.MaxValue)]
        public int ActualParticipants { get; set; }

        [MaxLength(200)]
        public string RegistrationLink { get; set; } = string.Empty;

        [Range(1, int.MaxValue)]
        public int ResponsibleUserId { get; set; }
    }

    public class UpdateEventDTO
    {
        [Required, MaxLength(100)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(400)]
        public string Description { get; set; } = string.Empty;

        [Range(0, double.MaxValue)]
        public decimal? Budget { get; set; }

        [Required]
        public DateTime EventDate { get; set; }

        [Required, MaxLength(100)]
        public string Location { get; set; } = string.Empty;

        [Range(0, int.MaxValue)]
        public int RegisteredParticipants { get; set; }

        [Range(0, int.MaxValue)]
        public int ActualParticipants { get; set; }

        [MaxLength(200)]
        public string RegistrationLink { get; set; } = string.Empty;

        [Range(1, int.MaxValue)]
        public int ResponsibleUserId { get; set; }

        [Required]
        public EventStatus Status { get; set; }
    }
    public class EventResponseDTO
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal? Budget { get; set; }
        public DateTime EventDate { get; set; }
        public string Location { get; set; } = string.Empty;
        public int RegisteredParticipants { get; set; }
        public int ActualParticipants { get; set; }
        public string? PhotoPath { get; set; }
        public string RegistrationLink { get; set; } = string.Empty;
        public EventStatus Status { get; set; }
        public int ResponsibleUserId { get; set; }
        public DateTime CreatedAt { get; set; }
    }
    public class EventListResponseDTO
    {
        public int Count { get; set; }
        public List<EventResponseDTO> Events { get; set; } = [];
    }
}
