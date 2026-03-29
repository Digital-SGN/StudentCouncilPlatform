using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentCouncil.Logic.DTOs;
using StudentCouncil.Logic.Interfaces;
using System.Security.Claims;
using StudentCouncil.Logic.Services;

namespace StudentCouncil.Web.Controllers;

[ApiController]
[Route("api/users")]
public class UserController : BaseController
{
    private readonly IUserService _userService;

    public UserController(IUserService userService, LoggerService logger) : base(logger)
    {
        _userService = userService;
    }

    [HttpGet]
    public async Task<ActionResult<UserListResponseDto>> GetAll()
    {
        try
        {
            if (!User.Identity.IsAuthenticated)
                return Unauthorized(new { error = "Не авторизован" });

            if (!User.IsInRole("Admin") && !User.IsInRole("Leader"))
                return StatusCode(403, new { error = "Доступ запрещён" });

            var users = await _userService.GetAllUsersWithRolesAsync();

            var response = new UserListResponseDto
            {
                Count = users.Count,
                Users = users
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.Error($"Ошибка получения списка пользователей: {ex.Message}");
            return StatusCode(500, new { error = "Ошибка получения списка пользователей" });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<UserDto>> GetById(int id)
    {
        if (!User.Identity.IsAuthenticated)
            return Unauthorized(new { error = "Не авторизован" });

        var user = await _userService.GetUserByIdAsync(id);

        if (user == null)
            return NotFound(new { error = "Пользователь не найден" });

        var currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        var isAdminOrLeader = User.IsInRole("Admin") || User.IsInRole("Leader");
        var isOwnProfile = currentUserId == id;

        if (!isOwnProfile && !isAdminOrLeader)
            return StatusCode(403, new { error = "Доступ запрещён" });

        return Ok(user);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Leader")]
    public async Task<ActionResult<UserDto>> Create([FromBody] CreateUserDto dto)
    {
        if (!User.Identity.IsAuthenticated)
            return Unauthorized(new { error = "Не авторизован" });

        if (!ModelState.IsValid)
            return BadRequest(new { errors = GetModelStateErrors() });

        var result = await _userService.CreateUserAsync(dto, dto.Password);

        if (result)
        {
            _logger.Info($"Создан пользователь {dto.Email} админом {User.Identity.Name}");
            return Ok(new { message = "Пользователь успешно создан" });
        }

        return BadRequest(new { error = "Ошибка создания пользователя" });
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> Update(int id, [FromBody] UpdateUserDto dto)
    {
        if (!User.Identity.IsAuthenticated)
            return Unauthorized(new { error = "Не авторизован" });

        var success = await _userService.UpdateUserAsync(id, dto, User);

        if (!success)
            return Forbid();

        return Ok(new { message = "Данные успешно обновлены" });
    }

    [Authorize(Roles = "Admin,Leader")]
    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        if (!User.Identity.IsAuthenticated)
            return Unauthorized(new { error = "Не авторизован" });

        var user = await _userService.GetUserByIdAsync(id);
        var success = await _userService.DeleteUserAsync(id, User);

        if (!success)
        {
            return BadRequest(new { error = "Нельзя удалить последнего администратора" });
        }

        _logger.Info($"Пользователь {user?.Email} удалён пользователем {User.Identity.Name}");
        return Ok(new { message = "Пользователь успешно удалён" });
    }

    [HttpPost("{id}/avatar")]
    [Authorize]
    public async Task<IActionResult> UploadAvatar(int id, IFormFile avatar)
    {
        if (!User.Identity.IsAuthenticated)
            return Unauthorized(new { error = "Не авторизован" });

        if (avatar == null || avatar.Length == 0)
            return BadRequest(new { error = "Файл не выбран" });

        var success = await _userService.UpdateAvatarAsync(id, avatar, User);

        if (!success)
            return Forbid();

        return Ok(new { message = "Аватар загружен" });
    }

    [HttpDelete("{id}/avatar")]
    [Authorize]
    public async Task<IActionResult> DeleteAvatar(int id)
    {
        if (!User.Identity.IsAuthenticated)
            return Unauthorized(new { error = "Не авторизован" });

        var success = await _userService.DeleteAvatarAsync(id, User);

        if (!success)
            return Forbid();

        return Ok(new { message = "Аватар удалён" });
    }
}