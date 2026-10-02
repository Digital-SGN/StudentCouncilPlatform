namespace StudentCouncil.Logic.Exceptions;

/// <summary>400 Bad Request — некорректные данные от клиента</summary>
public class BadRequestException : AppException
{
    public BadRequestException(string message = "Некорректный запрос")
        : base(400, message) { }
}

/// <summary>401 Unauthorized — не аутентифицирован</summary>
public class UnauthorizedException : AppException
{
    public UnauthorizedException(string message = "Требуется авторизация")
        : base(401, message) { }
}

/// <summary>403 Forbidden — нет прав на действие</summary>
public class ForbiddenException : AppException
{
    public ForbiddenException(string message = "Доступ запрещён")
        : base(403, message) { }
}

/// <summary>404 Not Found — ресурс не найден</summary>
public class NotFoundException : AppException
{
    public NotFoundException(string message = "Ресурс не найден")
        : base(404, message) { }
}

/// <summary>409 Conflict — конфликт с текущим состоянием (например, дубликат)</summary>
public class ConflictException : AppException
{
    public ConflictException(string message = "Конфликт данных")
        : base(409, message) { }
}