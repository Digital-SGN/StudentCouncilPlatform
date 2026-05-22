namespace StudentCouncil.Logic.DTOs
{
    public class CreateUserDTO
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string? Patronymic { get; set; }
        public string? Group { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Telegram { get; set; }
        public string Role { get; set; }= string.Empty;
        public string? ClothingSize { get; set; }
        public DateTime? BirthDate { get; set; }
    }

    public class CurrentUserDTO
    {
        public int Id { get; set; }
        public required string Email { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public required string Role { get; set; }
        public string? AvatarPath { get; set; }
        public bool IsActive { get; set; }
    }

    public class UpdateUserDTO
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string? Patronymic { get; set; }
        public string? Group { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Telegram { get; set; }
        public string? ClothingSize { get; set; }
        public DateTime? BirthDate { get; set; }
        public DateTime JoinedAt { get; set; }
        public int Balance { get; set; }
        public int ExperiencePoints { get; set; }
        public bool IsActive { get; set; }
        public string Role { get; set; } = "Member";
    }

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
    public class UserListResponseDTO
    {
        public int Count { get; set; }
        public List<UserDTO>? Users { get; set; }
    }
}

