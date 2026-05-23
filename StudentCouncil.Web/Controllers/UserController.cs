using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentCouncil.Logic.Interfaces;
using StudentCouncil.Logic.Services;
using StudentCouncil.Logic.DTOs;

namespace StudentCouncil.Web.Controllers;

[ApiController]
[Route("api/users")]
public class UserController : BaseController
{
    private readonly IUserService _userService;

    public UserController(IUserService userService, ILoggerService logger) : base(logger)
    {
        _userService = userService;
    }

    [HttpGet]
    [Authorize(Roles = "Admin,Leader")]
    public async Task<IActionResult> GetAllAsync()
    {
        ServiceResult<UserListResponseDTO> result = await _userService.GetAllUsersAsync();
        return HandleServiceResult(result);
    }

    [HttpGet("{id}")]
    [Authorize]
    public async Task<IActionResult> GetByIdAsync(int id)
    {
        ServiceResult<UserDTO> result = await _userService.GetUserByIdAsync(id, User);
        return HandleServiceResult(result);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateAsync([FromBody] CreateUserDTO dto)
    {
        ServiceResult result = await _userService.CreateUserAsync(dto, dto.Password);
        return HandleServiceResult(result);
    }


    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> UpdateAsync(int id, [FromBody] UpdateUserDTO dto)
    {
        ServiceResult result = await _userService.UpdateUserAsync(id, dto, User);
        return HandleServiceResult(result);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteAsync(int id)
    {
        ServiceResult result = await _userService.DeleteUserAsync(id, User);
        return HandleServiceResult(result);
    }

    [HttpPost("{id}/avatar")]
    [Authorize]
    [RequestSizeLimit(10_485_760)]
    public async Task<IActionResult> UploadAvatarAsync(int id, IFormFile avatar)
    {
        ServiceResult result = await _userService.UpdateAvatarAsync(id, avatar, User);
        return HandleServiceResult(result);
    }

    [HttpDelete("{id}/avatar")]
    [Authorize]
    public async Task<IActionResult> DeleteAvatarAsync(int id)
    {
        ServiceResult result = await _userService.DeleteAvatarAsync(id, User);
        return HandleServiceResult(result);
    }

    [HttpPost("{id}/reset-password")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ResetPasswordAsync(int id, [FromBody] ResetPasswordDTO dto)
    {
        if (string.IsNullOrWhiteSpace(dto.NewPassword))
            return BadRequest(new { error = "Новый пароль не может быть пустым" });

        var result = await _userService.ResetPasswordAsync(id, dto.NewPassword, User);
        return HandleServiceResult(result);
    }
}