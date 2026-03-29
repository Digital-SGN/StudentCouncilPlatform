namespace StudentCouncil.Logic.Services;

public class LoggerService
{
    private readonly string _logFilePath;
    private readonly object _lock = new object();

    public LoggerService()
    {
        var logDirectory = Path.Combine(Directory.GetCurrentDirectory(), "Logs");
        if (!Directory.Exists(logDirectory))
        {
            Directory.CreateDirectory(logDirectory);
        }

        _logFilePath = Path.Combine(logDirectory, $"log_{DateTime.Now:yyyy-MM-dd}.txt");
    }

    public void Log(string message, string level = "INFO")
    {
        lock (_lock)
        {
            try
            {
                var logMessage = $"{DateTime.Now:yyyy-MM-dd HH:mm:ss} [{level}] {message}";
                File.AppendAllText(_logFilePath, logMessage + Environment.NewLine);
            }
            catch { }
        }
    }

    public void Info(string message) => Log(message, "INFO");
    public void Warning(string message) => Log(message, "WARN");
    public void Error(string message) => Log(message, "ERROR");
}