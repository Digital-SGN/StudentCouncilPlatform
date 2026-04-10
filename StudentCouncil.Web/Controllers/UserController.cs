using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentCouncil.Logic.Interfaces;
using System.Security.Claims;
using StudentCouncil.Logic.Services;
using StudentCouncil.Logic.DTOs;

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
    [Authorize(Roles = "Admin,Leader")]
    public async Task<IActionResult> GetAll()
    {
        ServiceResult<List<UserDTO>> result = await _userService.GetAllUsersAsync();

        if (!result.Success)
            return HandleServiceResult(result);

        return Ok(new { count = result.Data?.Count ?? 0, users = result.Data });
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "Admin,Leader")]
    public async Task<IActionResult> GetById(int id)
    {
        ServiceResult<UserDTO> result = await _userService.GetUserByIdAsync(id);

        return HandleServiceResult(result);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] CreateUserDTO dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(new { errors = GetModelStateErrors() });

        ServiceResult result = await _userService.CreateUserAsync(dto, dto.Password);

        if (!result.Success)
            return HandleServiceResult(result);

        _logger.Info($"Создан пользователь {dto.Email} админом {User.Identity?.Name ?? "неизвестный"}");
        return Ok(new { message = result.Message });
    }


    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateUserDTO dto)
    {
        var result = await _userService.UpdateUserAsync(id, dto, User);
        return HandleServiceResult(result);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        ServiceResult result = await _userService.DeleteUserAsync(id, User);

        if (!result.Success)
            return HandleServiceResult(result);

        _logger.Info($"Пользователь {id} удалён админом {User.Identity?.Name ?? "неизвестный"}");
        return Ok(new { message = result.Message });
    }

    [HttpPost("{id}/avatar")]
    [Authorize]
    public async Task<IActionResult> UploadAvatar(int id, IFormFile avatar)
    {
        if (avatar == null || avatar.Length == 0)
            return BadRequest(new { error = "Файл не выбран" });

        ServiceResult result = await _userService.UpdateAvatarAsync(id, avatar, User);
        return HandleServiceResult(result);
    }

    [HttpDelete("{id}/avatar")]
    [Authorize]
    public async Task<IActionResult> DeleteAvatar(int id)
    {
        ServiceResult result = await _userService.DeleteAvatarAsync(id, User);
        return HandleServiceResult(result);
    }
}