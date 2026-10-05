using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using StudentCouncil.Data.Models;
using StudentCouncil.Logic.DTOs;

namespace StudentCouncil.Web.Controllers;

[ApiController]
[Route("api/account")]
public class AccountController : BaseController
{
    private readonly UserManager<User> _userManager;
    private readonly SignInManager<User> _signInManager;
    private readonly ITimeLimitedDataProtector _setupTokenProtector;
    private readonly ILogger<AccountController> _logger;

    private static readonly TimeSpan SetupTokenLifetime = TimeSpan.FromMinutes(10);

    public AccountController(
        SignInManager<User> signInManager,
        UserManager<User> userManager,
        IDataProtectionProvider dataProtectionProvider,
        ILogger<AccountController> logger)
    {
        _signInManager = signInManager;
        _userManager = userManager;
        _setupTokenProtector = dataProtectionProvider.CreateProtector("AccountController.TwoFactorSetup").ToTimeLimitedDataProtector();
        _logger = logger;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> LoginAsync([FromBody] LoginRequestDTO request)
    {
        User? user = await _userManager.FindByEmailAsync(request.Email);

        if (user == null || !user.IsActive)
        {
            _logger.LogWarning("Попытка входа с несуществующим/неактивным email: {Email}", request.Email);
            return Unauthorized(new { error = "Неверный email или пароль" });
        }

        var result = await _signInManager.PasswordSignInAsync(user, request.Password, isPersistent: false, lockoutOnFailure: true);

        if (result.IsLockedOut)
        {
            _logger.LogWarning("Аккаунт {Email} заблокирован после неудачных попыток", user.Email);
            return Unauthorized(new { error = "Неверный email или пароль" });
        }

        if (result.IsNotAllowed)
        {
            return Unauthorized(new { error = "Неверный email или пароль" });
        }

        if (result.RequiresTwoFactor)
        {
            return Ok(new LoginResultDTO { Status = "twoFactorRequired" });
        }

        if (!result.Succeeded)
        {
            return Unauthorized(new { error = "Неверный email или пароль" });
        }

        bool isTwoFactorEnabled = await _userManager.GetTwoFactorEnabledAsync(user);

        if (isTwoFactorEnabled)
        {
            IList<string> roles = await _userManager.GetRolesAsync(user);
            return Ok(new LoginResultDTO
            {
                Status = "ok",
                User = new LoginResponseDTO
                {
                    Id = user.Id,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    Role = roles.FirstOrDefault() ?? "Member"
                }
            });
        }

        await _signInManager.SignOutAsync();

        string? key = await _userManager.GetAuthenticatorKeyAsync(user);
        if (string.IsNullOrEmpty(key))
        {
            await _userManager.ResetAuthenticatorKeyAsync(user);
            key = await _userManager.GetAuthenticatorKeyAsync(user);
        }

        if (string.IsNullOrEmpty(key))
        {
            _logger.LogError("Не удалось получить authenticator key для user {UserId}", user.Id);
            return StatusCode(500, new { error = "Ошибка настройки 2FA" });
        }

        string issuer = "Студсовет СГН";
        string uri =
            $"otpauth://totp/{Uri.EscapeDataString($"{issuer}:{user.Email}")}" +
            $"?secret={key}&issuer={Uri.EscapeDataString(issuer)}&digits=6";

        string setupToken = _setupTokenProtector.Protect(user.Id.ToString(), SetupTokenLifetime);

        _logger.LogInformation("Пользователь {UserId} направлен на настройку 2FA", user.Id);

        return Ok(new LoginResultDTO
        {
            Status = "twoFactorSetupRequired",
            SharedKey = key,
            AuthenticatorUri = uri,
            SetupToken = setupToken
        });
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> LogoutAsync()
    {
        await _signInManager.SignOutAsync();
        return Ok(new { message = "Выход успешно выполнен" });
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<CurrentUserDTO>> GetCurrentUserAsync()
    {
        User? user = await _signInManager.UserManager.GetUserAsync(User);
        if (user == null)
            return Unauthorized();

        IList<string> roles = await _signInManager.UserManager.GetRolesAsync(user);

        return Ok(new CurrentUserDTO
        {
            Id = user.Id,
            Email = user.Email ?? string.Empty,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Role = roles.FirstOrDefault() ?? "Member",
            AvatarPath = user.AvatarPath,
            IsActive = user.IsActive
        });
    }

    [HttpPost("2fa/activation")]
    public async Task<IActionResult> SetupAndEnableTwoFactor([FromBody] TwoFactorSetupConfirmDTO dto)
    {
        if (string.IsNullOrWhiteSpace(dto.SetupToken))
        {
            _logger.LogWarning("Попытка активации 2FA без токена настройки");
            return Unauthorized(new { error = "Начните вход заново" });
        }

        int userId;
        try
        {
            string userIdStr = _setupTokenProtector.Unprotect(dto.SetupToken);
            userId = int.Parse(userIdStr);
        }
        catch
        {
            _logger.LogWarning("Попытка активации 2FA с недействительным/истёкшим токеном");
            return Unauthorized(new { error = "Токен настройки недействителен или истёк. Войдите заново." });
        }

        User? user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null || !user.IsActive)
            return Unauthorized(new { error = "Токен настройки недействителен" });

        if (!string.Equals(user.Email, dto.Email, StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogWarning("2FA setup: несовпадение email для user {UserId}", userId);
            return Unauthorized(new { error = "Токен настройки недействителен" });
        }

        string? key = await _userManager.GetAuthenticatorKeyAsync(user);
        if (string.IsNullOrEmpty(key))
        {
            _logger.LogWarning("2FA setup: у user {UserId} отсутствует ключ", userId);
            return BadRequest(new { error = "Начните настройку 2FA заново" });
        }

        bool isValid = await _userManager.VerifyTwoFactorTokenAsync(
            user, TokenOptions.DefaultAuthenticatorProvider, dto.Code);
        if (!isValid)
            return BadRequest(new { error = "Неверный код" });

        await _userManager.SetTwoFactorEnabledAsync(user, true);
        await _signInManager.SignInAsync(user, isPersistent: false);

        _logger.LogInformation("2FA включена для пользователя {UserId}", user.Id);

        IList<string> roles = await _userManager.GetRolesAsync(user);
        return Ok(new LoginResponseDTO
        {
            Id = user.Id,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Role = roles.FirstOrDefault() ?? "Member"
        });
    }

    [HttpPost("2fa/verification")]
    [AllowAnonymous]
    public async Task<IActionResult> LoginWithTwoFactor([FromBody] TwoFactorConfirmDTO dto)
    {
        User? user = await _signInManager.GetTwoFactorAuthenticationUserAsync();
        if (user == null)
            return Unauthorized(new { error = "Сессия истекла, войдите заново" });

        var result = await _signInManager.TwoFactorAuthenticatorSignInAsync(dto.Code, false, dto.RememberDevice);
        if (result.Succeeded)
        {
            IList<string> roles = await _userManager.GetRolesAsync(user);
            return Ok(new LoginResponseDTO
            {
                Id = user.Id,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Role = roles.FirstOrDefault() ?? "Member"
            });
        }

        return BadRequest(new { error = "Неверный код двухфакторной аутентификации" });
    }

    [HttpDelete("2fa/{userId}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ResetTwoFactor(int userId)
    {
        User? user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null) return NotFound();

        if (!await _userManager.GetTwoFactorEnabledAsync(user))
            return BadRequest(new { error = "У пользователя не настроена 2FA" });

        await _userManager.SetTwoFactorEnabledAsync(user, false);
        await _userManager.ResetAuthenticatorKeyAsync(user);
        return Ok();
    }
}