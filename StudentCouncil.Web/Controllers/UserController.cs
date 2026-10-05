using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentCouncil.Logic.DTOs;
using StudentCouncil.Logic.Exceptions;
using StudentCouncil.Logic.Interfaces;

namespace StudentCouncil.Web.Controllers;

[ApiController]
[Route("api/users")]
public class UserController : BaseController
{
    private readonly IUserService _userService;

    public UserController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpGet]
    [Authorize(Roles = "Admin,Leader")]
    public async Task<IActionResult> GetAllAsync()
    {
        UserListResponseDTO result = await _userService.GetAllUsersAsync(User);
        return Ok(result);
    }

    [HttpGet("{id}")]
    [Authorize]
    public async Task<IActionResult> GetByIdAsync(int id)
    {
        UserDTO result = await _userService.GetUserByIdAsync(id, User);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateAsync([FromBody] CreateUserDTO dto)
    {
        await _userService.CreateUserAsync(dto, dto.Password);
        return StatusCode(201, new { message = "Пользователь успешно создан" });
    }

    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> UpdateAsync(int id, [FromBody] UpdateUserDTO dto)
    {
        await _userService.UpdateUserAsync(id, dto, User);
        return Ok(new { message = "Данные успешно обновлены" });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteAsync(int id)
    {
        await _userService.DeleteUserAsync(id, User);
        return Ok(new { message = "Пользователь успешно удалён" });
    }

    [HttpPost("{id}/avatar")]
    [Authorize]
    [RequestSizeLimit(10_485_760)]
    public async Task<IActionResult> UploadAvatarAsync(int id, IFormFile avatar)
    {
        await _userService.UpdateAvatarAsync(id, avatar, User);
        return Ok(new { message = "Аватар успешно загружен" });
    }

    [HttpDelete("{id}/avatar")]
    [Authorize]
    public async Task<IActionResult> DeleteAvatarAsync(int id)
    {
        await _userService.DeleteAvatarAsync(id, User);
        return Ok(new { message = "Аватар успешно удалён" });
    }

    [HttpPost("{id}/reset-password")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ResetPasswordAsync(int id, [FromBody] ResetPasswordDTO dto)
    {
        if (string.IsNullOrWhiteSpace(dto.NewPassword))
            throw new BadRequestException("Новый пароль не может быть пустым");

        await _userService.ResetPasswordAsync(id, dto.NewPassword, User);
        return Ok(new { message = "Пароль успешно изменён" });
    }
}