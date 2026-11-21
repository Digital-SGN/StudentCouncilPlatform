using StudentCouncil.Logic.DTOs;
using System.Security.Claims;

namespace StudentCouncil.Logic.Interfaces;

public interface IAccountService
{
    Task<LoginResultDTO> LoginAsync(LoginRequestDTO request);
    Task<LoginResponseDTO> VerifyEmailCodeAsync(EmailVerificationDTO dto);
    Task ResendEmailCodeAsync(ResendEmailCodeDTO dto);
    Task<LoginResponseDTO> LoginWithTwoFactorAsync(TwoFactorConfirmDTO dto);
    Task<bool> GetTwoFactorStatusAsync(ClaimsPrincipal user);
    Task<TwoFactorSetupResponseDTO> BeginTwoFactorSetupAsync(ClaimsPrincipal user);
    Task ConfirmTwoFactorSetupAsync(ClaimsPrincipal user, TwoFactorConfirmDTO dto);
    Task DisableOwnTwoFactorAsync(ClaimsPrincipal user);
    Task ResetTwoFactorAsync(int userId);
    Task<CurrentUserDTO> GetCurrentUserAsync(ClaimsPrincipal user);
    Task LogoutAsync();
}