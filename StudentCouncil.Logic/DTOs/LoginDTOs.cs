using System.ComponentModel.DataAnnotations;

namespace StudentCouncil.Logic.DTOs
{
    public class LoginRequestDTO
    {
        [Required(ErrorMessage = "Email не может быть пустым")]
        [EmailAddress(ErrorMessage = "Некорректный email")]
        [MaxLength(256)]
        public required string Email { get; set; }

        [Required(ErrorMessage = "Пароль не может быть пустым")]
        [MaxLength(100)]
        public required string Password { get; set; }
    }

    public class LoginResponseDTO
    {
        public int Id { get; set; }
        public required string FirstName { get; set; }
        public required string LastName { get; set; }
        public required string Role { get; set; }
    }

    public class LoginResultDTO
    {
        public string Status { get; set; } = string.Empty;

        public LoginResponseDTO? User { get; set; }

        public string? SharedKey { get; set; }
        public string? AuthenticatorUri { get; set; }
        public string? SetupToken { get; set; }
    }
}