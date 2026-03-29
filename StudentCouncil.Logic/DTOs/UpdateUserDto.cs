namespace StudentCouncil.Logic.DTOs;

public class UpdateUserDto
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Patronymic { get; set; }
    public string? Group { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Telegram { get; set; }
    public string? ClothingSize { get; set; }
    public DateTime? BirthDate { get; set; }
    public bool IsActive { get; set; }
    public string Role { get; set; } = "Member";
}