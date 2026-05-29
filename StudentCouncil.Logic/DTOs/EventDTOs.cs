using StudentCouncil.Data.Models;

namespace StudentCouncil.Logic.DTOs
{
    public class CreateEventDTO
    {
        public string Title { get; set; } = string.Empty;
        public string Description {  get; set; } = string.Empty;
        public decimal? Budget { get; set; }
        public DateTime EventDate { get; set; }
        public string Location { get; set; } = string.Empty;
        public int RegisteredParticipants { get; set; }
        public int ActualParticipants { get; set; }
        public string RegistrationLink {  get; set; } = string.Empty;
        public int ResponsibleUserId { get; set; }
    }
    public class UpdateEventDTO
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal? Budget { get; set; }
        public DateTime EventDate { get; set; }
        public string Location { get; set; } = string.Empty;
        public int RegisteredParticipants { get; set; }
        public int ActualParticipants { get; set; }
        public string RegistrationLink { get; set; } = string.Empty;
        public int ResponsibleUserId { get; set; }
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
