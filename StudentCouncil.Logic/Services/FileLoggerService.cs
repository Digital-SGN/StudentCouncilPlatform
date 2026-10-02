using System.Threading.Channels;
using StudentCouncil.Logic.Interfaces;

namespace StudentCouncil.Logic.Services;

public class FileLoggerService : ILoggerService, IAsyncDisposable
{
    private readonly Channel<LogEntry> _channel;
    private readonly CancellationTokenSource _cts;
    private readonly Task _writerTask;

    private readonly string _logDirectory;

    private record LogEntry(string Level, string Message, DateTime Timestamp);

    public FileLoggerService()
    {
        _logDirectory = Path.Combine(Directory.GetCurrentDirectory(), "Logs");
        Console.WriteLine($"[FileLogger] Init. Dir: {_logDirectory}, exists: {Directory.Exists(_logDirectory)}");
        Directory.CreateDirectory(_logDirectory);
        Console.WriteLine($"[FileLogger] Dir after CreateDirectory: {Directory.Exists(_logDirectory)}");

        _channel = Channel.CreateUnbounded<LogEntry>(new UnboundedChannelOptions
        {
            SingleReader = true,
            SingleWriter = false
        });

        _cts = new CancellationTokenSource();
        _writerTask = Task.Run(() => ProcessLogQueueAsync(_cts.Token));
        Console.WriteLine("[FileLogger] Writer task started");
    }

    private void Log(string message, string level)
    {
        Console.WriteLine($"[FileLogger] {level}: {message}");
        LogEntry entry = new(level, message, DateTime.Now);
        bool ok = _channel.Writer.TryWrite(entry);
        Console.WriteLine($"[FileLogger] TryWrite result: {ok}");
    }

    public void Info(string message) => Log(message, "INFO");
    public void Warning(string message) => Log(message, "WARN");
    public void Error(string message) => Log(message, "ERROR");

    private async Task ProcessLogQueueAsync(CancellationToken cancellationToken)
    {
        Console.WriteLine("[FileLogger] Reader loop started");
        try
        {
            await foreach (LogEntry entry in _channel.Reader.ReadAllAsync(cancellationToken))
            {
                Console.WriteLine($"[FileLogger] Got entry: {entry.Level} {entry.Message}");
                await WriteToFileAsync(entry);
            }
        }
        catch (OperationCanceledException)
        {
            Console.WriteLine("[FileLogger] Cancelled");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[FileLogger] Queue FAILED: {ex}");
        }
        Console.WriteLine("[FileLogger] Reader loop exited");
    }

    private async Task WriteToFileAsync(LogEntry entry)
    {
        string logFilePath = Path.Combine(_logDirectory, $"log_{entry.Timestamp:yyyy-MM-dd}.txt");
        string logMessage = $"{entry.Timestamp:yyyy-MM-dd HH:mm:ss} [{entry.Level}] {entry.Message}{Environment.NewLine}";

        Console.WriteLine($"[FileLogger] Writing to: {logFilePath}");

        try
        {
            await File.AppendAllTextAsync(logFilePath, logMessage);
            Console.WriteLine("[FileLogger] Write OK");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[FileLogger] Write FAILED: {ex}");
        }
    }

    public async ValueTask DisposeAsync()
    {
        _channel.Writer.Complete();
        await _cts.CancelAsync();
        await _writerTask;
        _cts.Dispose();
    }
}