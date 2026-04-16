using Microsoft.AspNetCore.Mvc;
using StudentCouncil.Logic.Services;
using StudentCouncil.Logic.Interfaces;

namespace StudentCouncil.Web.Controllers;

[ApiController]
[Produces("application/json")]
public abstract class BaseController : ControllerBase
{
    protected readonly ILoggerService _logger;

    public BaseController(ILoggerService logger)
    {
        _logger = logger;
    }

    protected IActionResult HandleServiceResult(ServiceResult result)
    {
        if (result.Success)
        {
            return result.StatusCode switch
            {
                201 => Created(string.Empty, new { message = result.Message }),
                _ => Ok(new { message = result.Message })
            };
        }

        return result.StatusCode switch
        {
            400 => BadRequest(new { error = result.Message }),
            401 => Unauthorized(new { error = result.Message }),
            403 => StatusCode(403, new { error = result.Message }),
            404 => NotFound(new { error = result.Message }),
            409 => Conflict(new { error = result.Message }),
            500 => StatusCode(500, new { error = result.Message }),
            _ => BadRequest(new { error = result.Message })
        };
    }

    protected IActionResult HandleServiceResult<T>(ServiceResult<T> result)
    {
        if (result.Success)
        {
            if (result.Data != null)
            {
                return result.StatusCode switch
                {
                    201 => Created(string.Empty, result.Data),
                    _ => Ok(result.Data)
                };
            }
            return result.StatusCode switch
            {
                _ => Ok(new { message = result.Message })
            };
        }

        return result.StatusCode switch
        {
            400 => BadRequest(new { error = result.Message }),
            401 => Unauthorized(new { error = result.Message }),
            403 => StatusCode(403, new { error = result.Message }),
            404 => NotFound(new { error = result.Message }),
            409 => Conflict(new { error = result.Message }),
            500 => StatusCode(500, new { error = result.Message }),
            _ => BadRequest(new { error = result.Message })
        };
    }
}