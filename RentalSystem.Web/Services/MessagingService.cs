using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;
using RentalSystem.Web.Options;

namespace RentalSystem.Web.Services;

public interface IMessagingService
{
    Task SendEmailAsync(string toEmail, string subject, string htmlBody, string? textBody = null, CancellationToken cancellationToken = default);
}

public sealed class SmtpMessagingService : IMessagingService
{
    private readonly SmtpOptions _options;
    private readonly ILogger<SmtpMessagingService> _logger;

    public SmtpMessagingService(IOptions<SmtpOptions> options, ILogger<SmtpMessagingService> logger)
    {
        _options = options.Value;
        _logger = logger;
    }

    public async Task SendEmailAsync(string toEmail, string subject, string htmlBody, string? textBody = null, CancellationToken cancellationToken = default)
    {
        if (!_options.EnableEmail)
        {
            _logger.LogInformation("Email delivery disabled. Skipping outbound message to {Recipient} with subject {Subject}.", toEmail, subject);
            return;
        }

        if (string.IsNullOrWhiteSpace(_options.Host) || string.IsNullOrWhiteSpace(_options.FromEmail))
        {
            throw new InvalidOperationException("SMTP configuration is incomplete. Host and FromEmail are required when email delivery is enabled.");
        }

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_options.FromName, _options.FromEmail));
        message.To.Add(MailboxAddress.Parse(toEmail));
        message.Subject = subject;

        var bodyBuilder = new BodyBuilder
        {
            HtmlBody = htmlBody,
            TextBody = string.IsNullOrWhiteSpace(textBody) ? StripHtml(htmlBody) : textBody
        };

        message.Body = bodyBuilder.ToMessageBody();

        using var client = new SmtpClient();
        var socketOptions = _options.UseSsl ? SecureSocketOptions.StartTls : SecureSocketOptions.Auto;

        await client.ConnectAsync(_options.Host, _options.Port, socketOptions, cancellationToken);

        if (!string.IsNullOrWhiteSpace(_options.Username))
        {
            await client.AuthenticateAsync(_options.Username, _options.Password, cancellationToken);
        }

        await client.SendAsync(message, cancellationToken);
        await client.DisconnectAsync(true, cancellationToken);
    }

    private static string StripHtml(string htmlBody)
    {
        return string.Join(' ', htmlBody
            .Replace("<br>", " ", StringComparison.OrdinalIgnoreCase)
            .Replace("<br/>", " ", StringComparison.OrdinalIgnoreCase)
            .Replace("<br />", " ", StringComparison.OrdinalIgnoreCase)
            .Split('<', '>')
            .Where((_, index) => index % 2 == 0)
            .Select(part => part.Trim())
            .Where(part => !string.IsNullOrWhiteSpace(part)));
    }
}
