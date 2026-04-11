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
    private readonly SignInManager<User> _signInManager;

    public AccountController(SignInManager<User> signInManager, LoggerService logger) : base(logger)
    {
        _signInManager = signInManager;
    }

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponseDTO>> LoginAsync([FromBody] LoginRequestDTO request)
    {
        User? user = await _signInManager.UserManager.FindByEmailAsync(request.Email);

        if (user != null && !user.IsActive)
        {
            _logger.Warning($"Попытка входа в заблокированный аккаунт: {request.Email}");
            return BadRequest(new { error = "Аккаунт заблокирован" });
        }

        Microsoft.AspNetCore.Identity.SignInResult result = await _signInManager.PasswordSignInAsync(request.Email, request.Password, false, false);

        if (result.Succeeded)
        {
            IList<string> roles = await _signInManager.UserManager.GetRolesAsync(user);
            _logger.Info($"Успешный вход: {request.Email}");

            return Ok(new LoginResponseDTO
            {
                Id = user.Id,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Role = roles.FirstOrDefault() ?? "Member"
            });
        }

        _logger.Warning($"Неудачная попытка входа: {request.Email}");
        return Unauthorized(new { error = "Неверный email или пароль" });
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> LogoutAsync()
    {
        await _signInManager.SignOutAsync();
        return Ok(new { message = "Выход успешно выполнен" });
    }

    [HttpGet("current")]
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
}