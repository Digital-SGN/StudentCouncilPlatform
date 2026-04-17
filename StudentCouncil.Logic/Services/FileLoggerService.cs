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
        Directory.CreateDirectory(_logDirectory);

        _channel = Channel.CreateUnbounded<LogEntry>(new UnboundedChannelOptions
        {
            SingleReader = true,
            SingleWriter = false
        });

        _cts = new CancellationTokenSource();
        _writerTask = Task.Run(() => ProcessLogQueueAsync(_cts.Token));
    }

    private void Log(string message, string level)
    {
        LogEntry entry = new(level, message, DateTime.Now);
        _channel.Writer.TryWrite(entry);
    }

    public void Info(string message) => Log(message, "INFO");
    public void Warning(string message) => Log(message, "WARN");
    public void Error(string message) => Log(message, "ERROR");

    private async Task ProcessLogQueueAsync(CancellationToken cancellationToken)
    {
        while (!cancellationToken.IsCancellationRequested)
        {
            try
            {
                await foreach (LogEntry entry in _channel.Reader.ReadAllAsync(cancellationToken))
                {
                    await WriteToFileAsync(entry);
                }
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception)
            {
            }
        }
    }

    private async Task WriteToFileAsync(LogEntry entry)
    {
        string logFilePath = Path.Combine(_logDirectory, $"log_{entry.Timestamp:yyyy-MM-dd}.txt");
        string logMessage = $"{entry.Timestamp:yyyy-MM-dd HH:mm:ss} [{entry.Level}] {entry.Message}{Environment.NewLine}";

        try
        {
            await File.AppendAllTextAsync(logFilePath, logMessage);
        }
        catch
        {
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