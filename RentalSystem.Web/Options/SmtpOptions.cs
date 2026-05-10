namespace RentalSystem.Web.Options;

public class SmtpOptions
{
    public const string SectionName = "Messaging:Smtp";

    public string Host { get; set; } = string.Empty;
    public int Port { get; set; } = 587;
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FromEmail { get; set; } = string.Empty;
    public string FromName { get; set; } = "RentalMgr Notifications";
    public bool UseSsl { get; set; } = true;
    public bool EnableEmail { get; set; } = false;
}
