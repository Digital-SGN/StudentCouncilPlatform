using Microsoft.AspNetCore.Mvc;
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
}