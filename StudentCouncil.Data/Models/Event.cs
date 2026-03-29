using System.ComponentModel.DataAnnotations;

namespace StudentCouncil.Data.Models;

public enum EventStatus
{
    Upcoming,    
    Completed,   
    Cancelled    
}

public class Event
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(400)]
    public string Description { get; set; } = string.Empty;

    [Required]
    public DateTime EventDate { get; set; }

    [Required]
    [MaxLength(100)]
    public string Location { get; set; } = string.Empty;

    [MaxLength(100)]
    public string RegistrationLink { get; set; } = string.Empty;

    public EventStatus Status { get; set; } = EventStatus.Upcoming;

    [Required]
    public int CreatedByUserId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public bool IsDeleted { get; set; } = false;
}
