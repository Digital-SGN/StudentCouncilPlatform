namespace StudentCouncil.Logic.Services;

public class ServiceResult
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public int? ErrorCode { get; set; }

    public static ServiceResult Ok(string message = "") =>
        new ServiceResult { Success = true, Message = message };

    public static ServiceResult Fail(string message, int? errorCode = null) =>
        new ServiceResult { Success = false, Message = message, ErrorCode = errorCode };
}

public class ServiceResult<T> : ServiceResult
{
    public T? Data { get; set; }

    public static ServiceResult<T> Ok(T data, string message = "") =>
        new ServiceResult<T> { Success = true, Data = data, Message = message };

    public static ServiceResult<T> Fail(string message, int? errorCode = null) =>
        new ServiceResult<T> { Success = false, Message = message, ErrorCode = errorCode };
}