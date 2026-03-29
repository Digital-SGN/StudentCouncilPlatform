namespace StudentCouncil.Logic.DTOs.UsersDTOs;

public class UserDTO
{
    public int Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Patronymic { get; set; }
    public string? Group { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? Telegram { get; set; }
    public string? ClothingSize { get; set; }
    public DateTime? BirthDate { get; set; }
    public DateTime JoinedAt { get; set; }
    public bool IsActive { get; set; }
    public string? AvatarPath { get; set; }
    public int Balance { get; set; }
    public int ExperiencePoints { get; set; }
    public int Level { get; set; }
    public int EventsAttended { get; set; }
    public int EventsOrganized { get; set; }
    public int TasksCompleted { get; set; }
    public string Role { get; set; } = "Member";
}