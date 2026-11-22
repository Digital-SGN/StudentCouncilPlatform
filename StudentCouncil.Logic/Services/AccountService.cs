using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using StudentCouncil.Data.Models;
using StudentCouncil.Logic.DTOs;
using StudentCouncil.Logic.Exceptions;
using StudentCouncil.Logic.Interfaces;
using System.Security.Claims;

namespace StudentCouncil.Logic.Services;

public class AccountService : IAccountService
{
    private readonly UserManager<User> _userManager;
    private readonly SignInManager<User> _signInManager;
    private readonly LoginCodeService _loginCodes;
    private readonly ILogger<AccountService> _logger;

    public AccountService(
        UserManager<User> userManager,
        SignInManager<User> signInManager,
        LoginCodeService loginCodes,
        ILogger<AccountService> logger)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _loginCodes = loginCodes;
        _logger = logger;
    }

    public async Task<LoginResultDTO> LoginAsync(LoginRequestDTO request)
    {
        User? user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null || !user.IsActive)
        {
            _logger.LogWarning("Вход: несуществующий/неактивный email {Email}", request.Email);

            return new LoginResultDTO { Status = LoginStatus.Error, Error = "Неверный email или пароль" };
        }

        SignInResult result = await _signInManager.PasswordSignInAsync(user, request.Password, isPersistent: false, lockoutOnFailure: true);

        if (result.IsLockedOut)
        {
            _logger.LogWarning("Аккаунт {Email} заблокирован после неудачных попыток", user.Email);

            return new LoginResultDTO { Status = LoginStatus.Locked, Error = "Слишком много неудачных попыток. Попробуйте через 5 минут." };

        }

        if (result.RequiresTwoFactor)
        {
            _logger.LogInformation("Требуется 2FA для {Email}", user.Email);
            return new LoginResultDTO { Status = LoginStatus.TwoFactorRequired };
        }

        if (!result.Succeeded)
            return new LoginResultDTO { Status = LoginStatus.Error, Error = "Неверный email или пароль" };

        if (!user.EmailConfirmed)
        {
            await _loginCodes.SendCodeAsync(user.Email!);
            _logger.LogInformation("Пользователь {UserId} направлен на подтверждение email", user.Id);
            return new LoginResultDTO { Status = LoginStatus.EmailVerificationRequired };
        }

        await _signInManager.SignInAsync(user, isPersistent: false);
        await _userManager.ResetAccessFailedCountAsync(user);

        LoginResponseDTO response = await CreateSuccessLoginResponse(user);
        return new LoginResultDTO { Status = LoginStatus.Success, User = response };
    }

    public async Task<LoginResponseDTO> VerifyEmailCodeAsync(EmailVerificationDTO dto)
    {
        User? user = await _userManager.FindByEmailAsync(dto.Email);
        if (user == null || !user.IsActive)
            throw new BadRequestException("Неверный код");

        if (user.EmailConfirmed)
            throw new BadRequestException("Email уже подтверждён");

        ValidateOutcome outcome = _loginCodes.Validate(user.Email!, dto.Code);
        switch (outcome)
        {
            case ValidateOutcome.Missing: throw new BadRequestException("Код не найден. Запросите новый.");
            case ValidateOutcome.Expired: throw new BadRequestException("Код истёк. Запросите новый.");
            case ValidateOutcome.TooManyAttempts: throw new ConflictException("Слишком много попыток. Запросите новый код.");
            case ValidateOutcome.Invalid: throw new BadRequestException("Неверный код");
        }

        user.EmailConfirmed = true;
        IdentityResult update = await _userManager.UpdateAsync(user);
        if (!update.Succeeded)
        {
            string errors = string.Join(", ", update.Errors.Select(e => e.Description));
            throw new BadRequestException($"Не удалось подтвердить email: {errors}");
        }

        await _signInManager.SignInAsync(user, isPersistent: false);
        await _userManager.ResetAccessFailedCountAsync(user);

        _logger.LogInformation("Email подтверждён для {Email}", user.Email);

        return await CreateSuccessLoginResponse(user); 
    }

    public async Task ResendEmailCodeAsync(ResendEmailCodeDTO dto)
    {
        User? user = await _userManager.FindByEmailAsync(dto.Email);

        if (user == null || !user.IsActive || user.EmailConfirmed)
            return; 

        bool sent = await _loginCodes.SendCodeAsync(user.Email!);
        if (!sent)
            throw new ConflictException("Подождите перед повторной отправкой кода");
    }

    public async Task<LoginResponseDTO> LoginWithTwoFactorAsync(TwoFactorConfirmDTO dto)
    {
        User? user = await _signInManager.GetTwoFactorAuthenticationUserAsync();
        if (user == null)
            throw new BadRequestException("Сессия истекла, войдите заново");

        var result = await _signInManager.TwoFactorAuthenticatorSignInAsync(dto.Code, false, dto.RememberDevice);
        if (!result.Succeeded)
            throw new BadRequestException("Неверный код двухфакторной аутентификации");

        return await CreateSuccessLoginResponse(user);
    }

    public async Task<bool> GetTwoFactorStatusAsync(ClaimsPrincipal currentUser)
    {
        User? user = await _userManager.GetUserAsync(currentUser);
        if (user == null) throw new UnauthorizedException("Пользователь не найден");
        return await _userManager.GetTwoFactorEnabledAsync(user);
    }

    public async Task<TwoFactorSetupResponseDTO> BeginTwoFactorSetupAsync(ClaimsPrincipal currentUser)
    {
        User? user = await _userManager.GetUserAsync(currentUser);
        if (user == null) throw new UnauthorizedException("Пользователь не найден");

        if (await _userManager.GetTwoFactorEnabledAsync(user))
            throw new BadRequestException("2FA уже включена");

        string? key = await _userManager.GetAuthenticatorKeyAsync(user);
        if (string.IsNullOrEmpty(key))
        {
            await _userManager.ResetAuthenticatorKeyAsync(user);
            key = await _userManager.GetAuthenticatorKeyAsync(user);
        }
        if (string.IsNullOrEmpty(key))
            throw new BadRequestException("Не удалось сгенерировать ключ");

        const string issuer = "Студсовет СГН";
        string uri = $"otpauth://totp/{Uri.EscapeDataString($"{issuer}:{user.Email}")}" +
                     $"?secret={key}&issuer={Uri.EscapeDataString(issuer)}&digits=6";

        return new TwoFactorSetupResponseDTO { SharedKey = key, AuthenticatorUri = uri };
    }

    public async Task ConfirmTwoFactorSetupAsync(ClaimsPrincipal currentUser, TwoFactorConfirmDTO dto)
    {
        User? user = await _userManager.GetUserAsync(currentUser);
        if (user == null) throw new UnauthorizedException("Пользователь не найден");

        bool valid = await _userManager.VerifyTwoFactorTokenAsync(user, TokenOptions.DefaultAuthenticatorProvider, dto.Code);
        if (!valid) throw new BadRequestException("Неверный код");

        await _userManager.SetTwoFactorEnabledAsync(user, true);
        _logger.LogInformation("2FA включена пользователем {UserId}", user.Id);
    }

    public async Task DisableOwnTwoFactorAsync(ClaimsPrincipal currentUser)
    {
        User? user = await _userManager.GetUserAsync(currentUser);
        if (user == null) throw new UnauthorizedException("Пользователь не найден");

        if (!await _userManager.GetTwoFactorEnabledAsync(user))
            throw new BadRequestException("2FA не включена");

        await _userManager.SetTwoFactorEnabledAsync(user, false);
        await _userManager.ResetAuthenticatorKeyAsync(user);
        await _userManager.UpdateSecurityStampAsync(user); 
        _logger.LogInformation("Пользователь {UserId} отключил свою 2FA", user.Id);
    }

    public async Task ResetTwoFactorAsync(int userId)
    {
        User? user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null) throw new NotFoundException("Пользователь не найден");

        if (!await _userManager.GetTwoFactorEnabledAsync(user))
            throw new BadRequestException("У пользователя не настроена 2FA");

        await _userManager.SetTwoFactorEnabledAsync(user, false);
        await _userManager.ResetAuthenticatorKeyAsync(user);
        await _userManager.UpdateSecurityStampAsync(user);
    }

    public async Task<CurrentUserDTO> GetCurrentUserAsync(ClaimsPrincipal currentUser)
    {
        User? user = await _userManager.GetUserAsync(currentUser);
        if (user == null) throw new UnauthorizedException("Пользователь не найден");

        IList<string> roles = await _userManager.GetRolesAsync(user);
        return new CurrentUserDTO
        {
            Id = user.Id,
            Email = user.Email ?? string.Empty,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Role = roles.FirstOrDefault() ?? "Member",
            AvatarPath = user.AvatarPath,
            IsActive = user.IsActive
        };
    }

    public async Task LogoutAsync()
    {
        await _signInManager.SignOutAsync();
    }

    private async Task<LoginResponseDTO> CreateSuccessLoginResponse(User user)
    {
        IList<string> roles = await _userManager.GetRolesAsync(user);

        return new LoginResponseDTO
        {
            Id = user.Id,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Role = roles.FirstOrDefault() ?? "Member"
        };
    }
}