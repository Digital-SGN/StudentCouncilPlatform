using Microsoft.AspNetCore.Mvc;
using StudentCouncil.Logic.Services;
using System.Security.Claims;

namespace StudentCouncil.Web.Controllers;

[ApiController]
[Produces("application/json")]
public abstract class BaseController : ControllerBase
{
    protected readonly LoggerService _logger;

    public BaseController(LoggerService logger)
    {
        _logger = logger;
    }

    protected List<string> GetModelStateErrors()
    {
        return ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
    }

    protected IActionResult UnauthorizedWithMessage() =>
        Unauthorized(new { error = "Не авторизован" });

    protected IActionResult ForbiddenWithMessage() =>
        StatusCode(403, new { error = "Доступ запрещён" });

    protected int GetCurrentUserId()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(userId, out var id) ? id : 0;
    }

    protected bool IsAdminOrLeader() =>
        User.IsInRole("Admin") || User.IsInRole("Leader");
}