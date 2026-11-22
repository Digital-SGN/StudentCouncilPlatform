using System.ComponentModel.DataAnnotations;

namespace StudentCouncil.Logic.DTOs
{
     public enum LoginStatus
     {
        Success,
        Error,
        Locked,
        TwoFactorRequired,
        EmailVerificationRequired
     }

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
        public LoginStatus Status { get; set; }
        public LoginResponseDTO? User { get; set; }
        public string? Error { get; set; }
    }

    public class EmailVerificationDTO
    {
        [Required, EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required, StringLength(6, MinimumLength = 6)]
        [RegularExpression(@"^\d{6}$", ErrorMessage = "Код должен состоять из 6 цифр")]
        public string Code { get; set; } = string.Empty;
    }

    public class ResendEmailCodeDTO
    {
        [Required, EmailAddress]
        public string Email { get; set; } = string.Empty;
    }
}