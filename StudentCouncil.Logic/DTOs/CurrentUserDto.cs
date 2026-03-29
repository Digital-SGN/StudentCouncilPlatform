namespace StudentCouncil.Logic.DTOs
{
    public class CurrentUserDto
    {
        public int Id { get; set; }
        public required string Email { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public required string Role { get; set; }
        public string? AvatarPath { get; set; }
        public bool IsActive { get; set; }
    }
}
