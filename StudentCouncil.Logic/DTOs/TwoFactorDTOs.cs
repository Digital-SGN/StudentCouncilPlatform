using System.ComponentModel.DataAnnotations;

namespace StudentCouncil.Logic.DTOs
{
    public class TwoFactorSetupResponseDTO
    {
        public string SharedKey { get; set; } = string.Empty;
        public string AuthenticatorUri { get; set; } = string.Empty;
        public string SetupToken { get; set; } = string.Empty;
    }

    public class TwoFactorConfirmDTO
    {
        [Required, StringLength(6, MinimumLength = 6)]
        [RegularExpression(@"^\d{6}$", ErrorMessage = "Код должен состоять из 6 цифр")]
        public string Code { get; set; } = string.Empty;

        public bool RememberDevice { get; set; } = false;
    }

    public class TwoFactorSetupConfirmDTO
    {
        [Required, EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required, StringLength(6, MinimumLength = 6)]
        [RegularExpression(@"^\d{6}$", ErrorMessage = "Код должен состоять из 6 цифр")]
        public string Code { get; set; } = string.Empty;

        [Required]
        public string SetupToken { get; set; } = string.Empty;
    }
}