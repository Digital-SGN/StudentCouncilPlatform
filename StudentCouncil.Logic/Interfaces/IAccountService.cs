using StudentCouncil.Logic.DTOs;
using System.Security.Claims;

namespace StudentCouncil.Logic.Interfaces;

public interface IAccountService
{
    /// <summary>Выполняет вход по email и паролю.</summary>
    /// <param name="request">Email и пароль пользователя.</param>
    /// <returns>Результат входа или требование дополнительной проверки.</returns>
    Task<LoginResultDTO> LoginAsync(LoginRequestDTO request);

    /// <summary>Подтверждает email шестизначным кодом.</summary>
    /// <param name="dto">Email пользователя и проверочный код.</param>
    /// <returns>Данные успешно вошедшего пользователя.</returns>
    Task<LoginResponseDTO> VerifyEmailCodeAsync(EmailVerificationDTO dto);

    /// <summary>Повторно отправляет код подтверждения email.</summary>
    /// <param name="dto">Email, для которого требуется отправить код.</param>
    Task ResendEmailCodeAsync(ResendEmailCodeDTO dto);

    /// <summary>Завершает вход с использованием кода двухфакторной аутентификации.</summary>
    Task<LoginResponseDTO> LoginWithTwoFactorAsync(TwoFactorConfirmDTO dto);

    /// <summary>Проверяет, включена ли двухфакторная аутентификация у текущего пользователя.</summary>
    Task<bool> GetTwoFactorStatusAsync(ClaimsPrincipal currentUser);

    /// <summary>Начинает настройку двухфакторной аутентификации.</summary>
    /// <returns>Секретный ключ и URI для приложения-аутентификатора.</returns>
    Task<TwoFactorSetupResponseDTO> BeginTwoFactorSetupAsync(ClaimsPrincipal currentUser);

    /// <summary>Подтверждает настройку двухфакторной аутентификации.</summary>
    Task ConfirmTwoFactorSetupAsync(ClaimsPrincipal currentUser, TwoFactorConfirmDTO dto);

    /// <summary>Отключает двухфакторную аутентификацию у текущего пользователя.</summary>
    Task DisableOwnTwoFactorAsync(ClaimsPrincipal currentUser);

    /// <summary>Сбрасывает двухфакторную аутентификацию указанного пользователя.</summary>
    /// <param name="userId">ID пользователя.</param>
    Task ResetTwoFactorAsync(int userId);

    /// <summary>Возвращает профиль текущего аутентифицированного пользователя.</summary>
    Task<CurrentUserDTO> GetCurrentUserAsync(ClaimsPrincipal currentUser);

    /// <summary>Завершает текущий сеанс входа.</summary>
    Task LogoutAsync();
}