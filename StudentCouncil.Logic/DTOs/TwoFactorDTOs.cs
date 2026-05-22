namespace StudentCouncil.Logic.DTOs
{
    public class TwoFactorSetupResponseDTO
    {
        public string SharedKey { get; set; } = string.Empty;
        public string AuthenticatorUri { get; set; } = string.Empty;
    }

    public class TwoFactorConfirmDTO
    {
        public string Code { get; set; } = string.Empty;
        public bool RememberDevice { get; set; } = false;
    }

    public class TwoFactorSetupConfirmDTO
    {
        public string Email { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
    }
}
