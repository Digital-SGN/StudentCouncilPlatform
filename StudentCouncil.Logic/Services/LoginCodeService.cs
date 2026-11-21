using MailKit;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;
using System.Security.Cryptography;
using System.Text;
using SmtpClient = MailKit.Net.Smtp.SmtpClient;

namespace StudentCouncil.Logic.Services;

public enum ValidateOutcome { Valid, Invalid, Expired, TooManyAttempts, Missing }

public sealed class SmtpOptions
{
    public string Host { get; set; } = "";
    public int Port { get; set; } = 587;
    public bool UseStartTls { get; set; } = true;
    public string User { get; set; } = "";
    public string Password { get; set; } = "";
    public string FromAddress { get; set; } = "noreply@studsovetsgn.ru";
    public string FromName { get; set; } = "Студсовет СГН";
}

public sealed class LoginCodeService
{
    private readonly IMemoryCache _cache;
    private readonly SmtpOptions _smtp;
    private readonly ILogger<LoginCodeService> _logger;

    private static readonly TimeSpan CodeLifetime = TimeSpan.FromMinutes(10);
    private static readonly TimeSpan ResendCooldown = TimeSpan.FromSeconds(60);
    private const int MaxAttempts = 5;

    public LoginCodeService(
        IMemoryCache cache,
        IOptions<SmtpOptions> smtp,
        ILogger<LoginCodeService> logger)
    {
        _cache = cache;
        _smtp = smtp.Value;
        _logger = logger;
    }
    public async Task<bool> SendCodeAsync(string email, CancellationToken ct = default)
    {
        if (!CanResend(email))
            return false;

        string code = RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");

        var record = new CodeRecord(Hash(email, code), 0, DateTimeOffset.UtcNow.Add(CodeLifetime));
        _cache.Set(CodeKey(email), record, CodeLifetime);
        _cache.Set(CooldownKey(email), true, ResendCooldown);

        await SendEmailAsync(email, code, ct);
        _logger.LogInformation("Код входа отправлен на {Email}", email);
        return true;
    }

    public bool CanResend(string email) => !_cache.TryGetValue(CooldownKey(email), out _);

    public ValidateOutcome Validate(string email, string code)
    {
        if (!_cache.TryGetValue<CodeRecord>(CodeKey(email), out CodeRecord? record) || record is null)
            return ValidateOutcome.Missing;

        if (record.ExpiresAt < DateTimeOffset.UtcNow)
        {
            _cache.Remove(CodeKey(email));
            return ValidateOutcome.Expired;
        }

        if (record.Attempts >= MaxAttempts)
        {
            _cache.Remove(CodeKey(email));
            return ValidateOutcome.TooManyAttempts;
        }

        byte[] expected = Convert.FromBase64String(Hash(email, code));
        byte[] actual = Convert.FromBase64String(record.Hash);

        if (!CryptographicOperations.FixedTimeEquals(expected, actual))
        {
            record = record with { Attempts = record.Attempts + 1 };
            TimeSpan remaining = record.ExpiresAt - DateTimeOffset.UtcNow;
            if (remaining <= TimeSpan.Zero) { _cache.Remove(CodeKey(email)); return ValidateOutcome.Expired; }
            _cache.Set(CodeKey(email), record, remaining);
            return ValidateOutcome.Invalid;
        }

        _cache.Remove(CodeKey(email));
        return ValidateOutcome.Valid;
    }

    private async Task SendEmailAsync(string toEmail, string code, CancellationToken ct)
    {
        var msg = new MimeMessage();
        msg.From.Add(new MailboxAddress(_smtp.FromName, _smtp.FromAddress));
        msg.To.Add(MailboxAddress.Parse(toEmail));
        msg.Subject = "Код подтверждения входа — Студсовет СГН";
        msg.Body = new TextPart("html") { Text = BuildHtml(code) };

        using var client = new SmtpClient();
        await client.ConnectAsync(_smtp.Host, _smtp.Port,
            _smtp.UseStartTls ? SecureSocketOptions.StartTls : SecureSocketOptions.Auto, ct);

        if (!string.IsNullOrEmpty(_smtp.User))
            await client.AuthenticateAsync(_smtp.User, _smtp.Password, ct);

        await client.SendAsync(msg, ct, null);
        await client.DisconnectAsync(true, ct);
    }

    private static string BuildHtml(string code) => $"""
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="color:#0CBFA1;margin:0 0 16px">Студсовет СГН</h2>
          <p>Ваш код для входа:</p>
          <div style="font-size:32px;font-weight:700;letter-spacing:6px;
                      background:#f0fdf9;color:#09707C;padding:16px;border-radius:12px;
                      text-align:center;margin:16px 0">{code}</div>
          <p style="color:#64748b;font-size:13px">
            Код действует 10 минут. Если вы не пытались войти — просто проигнорируйте письмо.
          </p>
        </div>
        """;

    private static string Hash(string email, string code) =>
        Convert.ToBase64String(SHA256.HashData(
            Encoding.UTF8.GetBytes($"{email.ToLowerInvariant()}:{code}")));

    private static string CodeKey(string email) => $"login-code:{email.ToLowerInvariant()}";
    private static string CooldownKey(string email) => $"login-code-cool:{email.ToLowerInvariant()}";

    private sealed record CodeRecord(string Hash, int Attempts, DateTimeOffset ExpiresAt);
}