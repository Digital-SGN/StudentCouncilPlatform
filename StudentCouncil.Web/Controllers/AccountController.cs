using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using StudentCouncil.Data.Models;
using StudentCouncil.Logic.DTOs;
using StudentCouncil.Logic.Interfaces;

namespace StudentCouncil.Web.Controllers;

[ApiController]
[Route("api/account")]
public class AccountController : BaseController
{
    private readonly UserManager<User> _userManager;
    private readonly SignInManager<User> _signInManager;

    public AccountController(SignInManager<User> signInManager, UserManager<User> userManager, ILoggerService logger) : base(logger)
    {
        _signInManager = signInManager;
        _userManager = userManager;
    }

    [HttpPost("login")]
    public async Task<IActionResult> LoginAsync([FromBody] LoginRequestDTO request)
    {
        User? user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null || !user.IsActive)
            return Unauthorized(new { error = "Неверный email или пароль" });

        bool passwordValid = await _userManager.CheckPasswordAsync(user, request.Password);
        if (!passwordValid)
            return Unauthorized(new { error = "Неверный email или пароль" });

        bool isTwoFactorEnabled = await _userManager.GetTwoFactorEnabledAsync(user);
        if (!isTwoFactorEnabled)
        {
            var key = await _userManager.GetAuthenticatorKeyAsync(user);
            if (string.IsNullOrEmpty(key))
            {
                await _userManager.ResetAuthenticatorKeyAsync(user);
                key = await _userManager.GetAuthenticatorKeyAsync(user);
            }
            string issuer = "Студсовет СГН";
            string prefix = issuer; 
            var uri = $"otpauth://totp/{Uri.EscapeDataString($"{prefix}:{user.Email}")}?secret={key}&issuer={Uri.EscapeDataString(issuer)}&digits=6";
            return StatusCode(402, new TwoFactorSetupResponseDTO { SharedKey = key, AuthenticatorUri = uri });
        }
        else
        {
            var result = await _signInManager.PasswordSignInAsync(user, request.Password, false, false);

            if (result.Succeeded)
            {
                var roles = await _userManager.GetRolesAsync(user);
                return Ok(new LoginResponseDTO
                {
                    Id = user.Id,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    Role = roles.FirstOrDefault() ?? "Member"
                });
            }

            if (result.RequiresTwoFactor)
            {
                return StatusCode(403, new { requiresTwoFactorCode = true });
            }

            return Unauthorized(new { error = "Неверный email или пароль" });
        }
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
        User? user = await _userManager.FindByEmailAsync(dto.Email);
        if (user == null) 
            return Unauthorized();

        var key = await _userManager.GetAuthenticatorKeyAsync(user);
        if (string.IsNullOrEmpty(key))
        {
            await _userManager.ResetAuthenticatorKeyAsync(user);
            key = await _userManager.GetAuthenticatorKeyAsync(user);
        }

        var isValid = await _userManager.VerifyTwoFactorTokenAsync(user, TokenOptions.DefaultAuthenticatorProvider, dto.Code);
        if (!isValid)
            return BadRequest(new { error = "Неверный код" });

        await _userManager.SetTwoFactorEnabledAsync(user, true);

        await _signInManager.SignInAsync(user, isPersistent: false);

        var roles = await _userManager.GetRolesAsync(user);
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
            var roles = await _userManager.GetRolesAsync(user);
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