using StudentCouncil.Logic.Exceptions;
using System.Security.Claims;

namespace StudentCouncil.Logic.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static int GetUserId(this ClaimsPrincipal user)
    {
        string? userIdStr = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out int userId))
            throw new UnauthorizedException("Не удалось определить пользователя");

        return userId;
    }

    public static bool IsAdmin(this ClaimsPrincipal user) => user.IsInRole("Admin");

    public static bool IsLeader(this ClaimsPrincipal user) => user.IsInRole("Leader");

    public static bool IsAdminOrLeader(this ClaimsPrincipal user) => user.IsInRole("Admin") || user.IsInRole("Leader");
}
