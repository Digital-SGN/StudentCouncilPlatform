namespace StudentCouncil.Logic.Exceptions;

/// <summary>
/// Базовое исключение приложения. Содержит HTTP-статус, который
/// middleware вернёт клиенту.
/// </summary>
public abstract class AppException : Exception
{
    public int StatusCode { get; }

    protected AppException(int statusCode, string message)
        : base(message)
    {
        StatusCode = statusCode;
    }
}