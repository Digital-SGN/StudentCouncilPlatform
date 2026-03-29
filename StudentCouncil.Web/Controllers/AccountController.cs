using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using StudentCouncil.Data.Models;
using StudentCouncil.Logic.DTOs;
using StudentCouncil.Logic.Services;

namespace StudentCouncil.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AccountController : BaseController
{
    private readonly SignInManager<User> _signInManager;

    public AccountController(SignInManager<User> signInManager, LoggerService logger) : base(logger)
    {
        _signInManager = signInManager;
    }

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponseDto>> Login([FromBody] LoginRequestDto request)
    {
        var user = await _signInManager.UserManager.FindByEmailAsync(request.Email);

        if (user != null && !user.IsActive)
        {
            _logger.Warning($"Попытка входа в заблокированный аккаунт: {request.Email}");
            return BadRequest(new { error = "Аккаунт заблокирован" });
        }

        var result = await _signInManager.PasswordSignInAsync(
            request.Email,
            request.Password,
            false,
            false);

        if (result.Succeeded)
        {
            var roles = await _signInManager.UserManager.GetRolesAsync(user);
            _logger.Info($"Успешный вход: {request.Email}");

            return Ok(new LoginResponseDto
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
    public async Task<IActionResult> Logout()
    {
        if (!User.Identity.IsAuthenticated)
            return Unauthorized(new { error = "Не авторизован" });

        await _signInManager.SignOutAsync();
        return Ok(new { message = "Выход выполнен" });
    }

    [HttpGet("current")]
    public async Task<ActionResult<CurrentUserDto>> GetCurrentUser()
    {
        if (!User.Identity.IsAuthenticated)
            return Unauthorized(new { error = "Не авторизован" });

        var user = await _signInManager.UserManager.GetUserAsync(User);
        if (user == null)
        {
            return Unauthorized(new { error = "Не авторизован" });
        }

        var roles = await _signInManager.UserManager.GetRolesAsync(user);

        return Ok(new CurrentUserDto
        {
            Id = user.Id,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Role = roles.FirstOrDefault() ?? "Member",
            AvatarPath = user.AvatarPath,
            IsActive = user.IsActive
        });
    }

}