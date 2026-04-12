namespace StudentCouncil.Logic.Services;

public class ServiceResult
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public int StatusCode { get; set; } 

    public static ServiceResult Result(int statusCode, string message = "")
    {
        bool success = statusCode >= 200 && statusCode < 300;
        return new ServiceResult
        {
            Success = success,
            StatusCode = statusCode,
            Message = message
        };
    }

    public static ServiceResult Ok(string message = "") => Result(200, message);
    public static ServiceResult Created(string message = "") => Result(201, message);

    public static ServiceResult BadRequest(string message = "") => Result(400, message);
    public static ServiceResult Unauthorized(string message = "") => Result(401, message);
    public static ServiceResult Forbidden(string message = "") => Result(403, message);
    public static ServiceResult NotFound(string message = "") => Result(404, message);
    public static ServiceResult Conflict(string message = "") => Result(409, message);
    public static ServiceResult InternalError(string message = "") => Result(500, message);
}

public class ServiceResult<T> : ServiceResult
{
    public T? Data { get; set; }

    public static ServiceResult<T> Result(int statusCode, T? data, string message = "")
    {
        bool success = statusCode >= 200 && statusCode < 300;
        return new ServiceResult<T>
        {
            Success = success,
            StatusCode = statusCode,
            Message = message,
            Data = data
        };
    }

    public static ServiceResult<T> Ok(T data, string message = "") => Result(200, data, message);
    public static ServiceResult<T> Created(T data, string message = "") => Result(201, data, message);

    public static new ServiceResult<T> BadRequest(string message = "") => Result(400, default, message);
    public static new ServiceResult<T> NotFound(string message = "") => Result(404, default, message);
    public static new ServiceResult<T> Unauthorized(string message = "") => Result(401, default, message);
    public static new ServiceResult<T> Forbidden(string message = "") => Result(403, default, message);
    public static new ServiceResult<T> InternalError(string message = "") => Result(500, default, message);
}