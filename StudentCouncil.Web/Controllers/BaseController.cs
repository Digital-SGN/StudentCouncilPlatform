using Microsoft.AspNetCore.Authorization;
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

    protected IActionResult HandleServiceResult(ServiceResult result)
    {
        if (result.Success)
            return Ok(new { message = result.Message });

        return result.ErrorCode switch
        {
            404 => NotFound(new { error = result.Message }),
            403 => Forbid(),
            400 => BadRequest(new { error = result.Message }),
            500 => StatusCode(500, new { error = result.Message }),
            _ => BadRequest(new { error = result.Message })
        };
    }

    protected IActionResult HandleServiceResult<T>(ServiceResult<T> result)
    {
        if (result.Success)
        {
            if (result.Data != null)
                return Ok(result.Data);

            if (!string.IsNullOrEmpty(result.Message))
                return Ok(new { message = result.Message });

            return Ok();
        }

        return result.ErrorCode switch
        {
            404 => NotFound(new { error = result.Message }),
            403 => Forbid(),
            400 => BadRequest(new { error = result.Message }),
            500 => StatusCode(500, new { error = result.Message }),
            _ => BadRequest(new { error = result.Message })
        };
    }

    protected List<string> GetModelStateErrors()
    {
        return ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
    }

    [Authorize]
    protected int GetCurrentUserId()
    {
        string? userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(userId, out var id) ? id : 0;
    }
}