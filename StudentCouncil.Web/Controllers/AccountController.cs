using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentCouncil.Logic.DTOs;
using StudentCouncil.Logic.Interfaces;

namespace StudentCouncil.Web.Controllers;

[ApiController]
[Route("api/account")]
public class AccountController : BaseController
{
    private readonly IAccountService _accountService;

    public AccountController(IAccountService accountService)
    {
        _accountService = accountService;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> LoginAsync([FromBody] LoginRequestDTO request)
    {
        LoginResultDTO result = await _accountService.LoginAsync(request);

        return result.Status switch
        {
            LoginStatus.Locked => StatusCode(429, new { error = result.Error }),
            LoginStatus.Error => Unauthorized(new { error = result.Error }),
            LoginStatus.TwoFactorRequired => Ok(new { status = "twoFactorRequired" }),
            LoginStatus.EmailVerificationRequired => Ok(new { status = "emailVerificationRequired" }),
            LoginStatus.Success => Ok(result.User),
            _ => StatusCode(500, new { error = "Внутренняя ошибка сервера" })
        };
    }

    [HttpPost("email/verify")]
    [AllowAnonymous]
    public async Task<IActionResult> VerifyEmailCodeAsync([FromBody] EmailVerificationDTO dto)
    {
        LoginResponseDTO result = await _accountService.VerifyEmailCodeAsync(dto);
        return Ok(result);
    }

    [HttpPost("email/resend")]
    [AllowAnonymous]
    public async Task<IActionResult> ResendEmailCodeAsync([FromBody] ResendEmailCodeDTO dto)
    {
        await _accountService.ResendEmailCodeAsync(dto);
        return Ok(new { message = "Если аккаунт существует и требует подтверждения, код будет отправлен" });
    }

    [HttpPost("2fa/verification")]
    [AllowAnonymous]
    public async Task<IActionResult> LoginWithTwoFactor([FromBody] TwoFactorConfirmDTO dto)
    {
        LoginResponseDTO result = await _accountService.LoginWithTwoFactorAsync(dto);
        return Ok(result);
    }

    [HttpGet("2fa/status")]
    [Authorize]
    public async Task<IActionResult> GetTwoFactorStatusAsync()
    {
        bool enabled = await _accountService.GetTwoFactorStatusAsync(User);
        return Ok(new { enabled });
    }

    [HttpPost("2fa/setup")]
    [Authorize]
    public async Task<IActionResult> BeginTwoFactorSetupAsync()
    {
        TwoFactorSetupResponseDTO result = await _accountService.BeginTwoFactorSetupAsync(User);
        return Ok(result);
    }

    [HttpPost("2fa/setup/confirm")]
    [Authorize]
    public async Task<IActionResult> ConfirmTwoFactorSetupAsync([FromBody] TwoFactorConfirmDTO dto)
    {
        await _accountService.ConfirmTwoFactorSetupAsync(User, dto);
        return Ok(new { message = "2FA включена" });
    }

    [HttpDelete("2fa/me")]
    [Authorize]
    public async Task<IActionResult> DisableOwnTwoFactorAsync()
    {
        await _accountService.DisableOwnTwoFactorAsync(User);
        return Ok(new { message = "2FA отключена" });
    }

    [HttpDelete("2fa/{userId}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ResetTwoFactor(int userId)
    {
        await _accountService.ResetTwoFactorAsync(userId);
        return Ok();
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> LogoutAsync()
    {
        await _accountService.LogoutAsync();
        return Ok(new { message = "Выход успешно выполнен" });
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<CurrentUserDTO>> GetCurrentUserAsync()
    {
        CurrentUserDTO user = await _accountService.GetCurrentUserAsync(User);
        return Ok(user);
    }
}