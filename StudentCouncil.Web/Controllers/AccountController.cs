using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using StudentCouncil.Data.Models;
using StudentCouncil.Logic.DTOs;
using StudentCouncil.Logic.Services;

namespace StudentCouncil.Web.Controllers;

[ApiController]
[Route("api/account")]
public class AccountController : BaseController
{
    private readonly UserManager<User> _userManager;
    private readonly SignInManager<User> _signInManager;
    private readonly LoginCodeService _loginCodes;
    private readonly ILogger<AccountController> _logger;

    public AccountController(
        SignInManager<User> signInManager,
        UserManager<User> userManager,
        LoginCodeService loginCodes,
        ILogger<AccountController> logger)
    {
        _signInManager = signInManager;
        _userManager = userManager;
        _loginCodes = loginCodes;
        _logger = logger;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> LoginAsync([FromBody] LoginRequestDTO request)
    {
        User? user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null || !user.IsActive)
        {
            _logger.LogWarning("Вход: несуществующий/неактивный email {Email}", request.Email);
            return Unauthorized(new { error = "Неверный email или пароль" });
        }

        var result = await _signInManager.CheckPasswordSignInAsync(
            user, request.Password, lockoutOnFailure: true);

        if (result.IsLockedOut)
        {
            _logger.LogWarning("Аккаунт {Email} заблокирован после неудачных попыток", user.Email);
            return StatusCode(429, new { error = "Слишком много неудачных попыток. Попробуйте через 5 минут." });
        }

        if (result.RequiresTwoFactor)
            return Ok(new LoginResultDTO { Status = "twoFactorRequired" });

        if (!result.Succeeded)
            return Unauthorized(new { error = "Неверный email или пароль" });

        if (!user.EmailConfirmed)
        {
            await _loginCodes.SendCodeAsync(user.Email!);

            _logger.LogInformation("Пользователь {UserId} направлен на подтверждение email", user.Id);
            return Ok(new LoginResultDTO { Status = "emailVerificationRequired" });
        }

        await _signInManager.SignInAsync(user, isPersistent: false);
        await _userManager.ResetAccessFailedCountAsync(user);

        IList<string> roles = await _userManager.GetRolesAsync(user);
        return Ok(new LoginResponseDTO
        {
            Id = user.Id,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Role = roles.FirstOrDefault() ?? "Member"
        });
    }

    [HttpPost("email/verify")]
    [AllowAnonymous]
    public async Task<IActionResult> VerifyEmailCodeAsync([FromBody] EmailVerificationDTO dto)
    {
        User? user = await _userManager.FindByEmailAsync(dto.Email);
        if (user == null || !user.IsActive)
            return Unauthorized(new { error = "Неверный код" });

        if (user.EmailConfirmed)
            return BadRequest(new { error = "Email уже подтверждён" });

        ValidateOutcome outcome = _loginCodes.Validate(user.Email!, dto.Code);
        switch (outcome)
        {
            case ValidateOutcome.Missing: return BadRequest(new { error = "Код не найден. Запросите новый." });
            case ValidateOutcome.Expired: return BadRequest(new { error = "Код истёк. Запросите новый." });
            case ValidateOutcome.TooManyAttempts: return StatusCode(429, new { error = "Слишком много попыток. Запросите новый код." });
            case ValidateOutcome.Invalid: return BadRequest(new { error = "Неверный код" });
        }

        user.EmailConfirmed = true;
        IdentityResult update = await _userManager.UpdateAsync(user);
        if (!update.Succeeded)
        {
            string errors = string.Join(", ", update.Errors.Select(e => e.Description));
            return BadRequest(new { error = $"Не удалось подтвердить email: {errors}" });
        }

        await _signInManager.SignInAsync(user, isPersistent: false);
        await _userManager.ResetAccessFailedCountAsync(user);

        _logger.LogInformation("Email подтверждён для {Email}", user.Email);

        IList<string> roles = await _userManager.GetRolesAsync(user);
        return Ok(new LoginResponseDTO
        {
            Id = user.Id,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Role = roles.FirstOrDefault() ?? "Member"
        });
    }

    [HttpPost("email/resend")]
    [AllowAnonymous]
    public async Task<IActionResult> ResendEmailCodeAsync([FromBody] ResendEmailCodeDTO dto)
    {
        User? user = await _userManager.FindByEmailAsync(dto.Email);

        if (user == null || !user.IsActive || user.EmailConfirmed)
            return Ok(new { message = "Если аккаунт существует и требует подтверждения, код будет отправлен" });

        bool sent = await _loginCodes.SendCodeAsync(user.Email!);

        if (!sent)
            return StatusCode(429, new { error = "Подождите перед повторной отправкой кода" });

        return Ok(new { message = "Код отправлен повторно" });
    }

    [HttpPost("2fa/verification")]
    [AllowAnonymous]
    public async Task<IActionResult> LoginWithTwoFactor([FromBody] TwoFactorConfirmDTO dto)
    {
        User? user = await _signInManager.GetTwoFactorAuthenticationUserAsync();
        if (user == null)
            return Unauthorized(new { error = "Сессия истекла, войдите заново" });

        var result = await _signInManager.TwoFactorAuthenticatorSignInAsync(dto.Code, false, dto.RememberDevice);
        if (!result.Succeeded)
            return BadRequest(new { error = "Неверный код двухфакторной аутентификации" });

        IList<string> roles = await _userManager.GetRolesAsync(user);
        return Ok(new LoginResponseDTO
        {
            Id = user.Id,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Role = roles.FirstOrDefault() ?? "Member"
        });
    }

    [HttpGet("2fa/status")]
    [Authorize]
    public async Task<IActionResult> GetTwoFactorStatusAsync()
    {
        User? user = await _userManager.GetUserAsync(User);
        if (user == null) return Unauthorized();
        return Ok(new { enabled = await _userManager.GetTwoFactorEnabledAsync(user) });
    }

    [HttpPost("2fa/setup")]
    [Authorize]
    public async Task<IActionResult> BeginTwoFactorSetupAsync()
    {
        User? user = await _userManager.GetUserAsync(User);
        if (user == null) return Unauthorized();

        if (await _userManager.GetTwoFactorEnabledAsync(user))
            return BadRequest(new { error = "2FA уже включена" });

        string? key = await _userManager.GetAuthenticatorKeyAsync(user);
        if (string.IsNullOrEmpty(key))
        {
            await _userManager.ResetAuthenticatorKeyAsync(user);
            key = await _userManager.GetAuthenticatorKeyAsync(user);
        }
        if (string.IsNullOrEmpty(key))
            return StatusCode(500, new { error = "Не удалось сгенерировать ключ" });

        const string issuer = "Студсовет СГН";
        string uri = $"otpauth://totp/{Uri.EscapeDataString($"{issuer}:{user.Email}")}" +
                     $"?secret={key}&issuer={Uri.EscapeDataString(issuer)}&digits=6";

        return Ok(new TwoFactorSetupResponseDTO { SharedKey = key, AuthenticatorUri = uri });
    }

    [HttpPost("2fa/setup/confirm")]
    [Authorize]
    public async Task<IActionResult> ConfirmTwoFactorSetupAsync([FromBody] TwoFactorConfirmDTO dto)
    {
        User? user = await _userManager.GetUserAsync(User);
        if (user == null) return Unauthorized();

        bool valid = await _userManager.VerifyTwoFactorTokenAsync(
            user, TokenOptions.DefaultAuthenticatorProvider, dto.Code);
        if (!valid) return BadRequest(new { error = "Неверный код" });

        await _userManager.SetTwoFactorEnabledAsync(user, true);
        _logger.LogInformation("2FA включена пользователем {UserId}", user.Id);
        return Ok(new { message = "2FA включена" });
    }

    [HttpDelete("2fa/me")]
    [Authorize]
    public async Task<IActionResult> DisableOwnTwoFactorAsync()
    {
        User? user = await _userManager.GetUserAsync(User);
        if (user == null) return Unauthorized();

        if (!await _userManager.GetTwoFactorEnabledAsync(user))
            return BadRequest(new { error = "2FA не включена" });

        await _userManager.SetTwoFactorEnabledAsync(user, false);
        await _userManager.ResetAuthenticatorKeyAsync(user);
        _logger.LogInformation("Пользователь {UserId} отключил свою 2FA", user.Id);
        return Ok(new { message = "2FA отключена" });
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
        if (user == null) return Unauthorized();

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
}