using StudentCouncil.Logic.Exceptions;
using System.Security.Claims;

namespace StudentCouncil.Logic.Extensions;

/// <summary>
/// Расширения для <see cref="ClaimsPrincipal"/> — извлечение данных текущего пользователя
/// </summary>
public static class ClaimsPrincipalExtensions
{
    /// <summary>
    /// Возвращает ID текущего пользователя из claim <see cref="ClaimTypes.NameIdentifier"/>.
    /// </summary>
    /// <exception cref="UnauthorizedException">
    /// Если claim отсутствует или содержит нечисловое значение.
    /// </exception>
    public static int GetUserId(this ClaimsPrincipal user)
    {
        string? userIdStr = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out int userId))
            throw new UnauthorizedException("Не удалось определить пользователя");

        return userId;
    }

    /// <summary>Текущий пользователь имеет роль Admin.</summary>
    public static bool IsAdmin(this ClaimsPrincipal user) => user.IsInRole("Admin");

    /// <summary>Текущий пользователь имеет роль Leader.</summary>
    public static bool IsLeader(this ClaimsPrincipal user) => user.IsInRole("Leader");

    /// <summary>Текущий пользователь имеет роль Admin или Leader.</summary>
    public static bool IsAdminOrLeader(this ClaimsPrincipal user) => user.IsInRole("Admin") || user.IsInRole("Leader");
}