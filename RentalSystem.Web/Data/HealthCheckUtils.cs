using System.Text.Json;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace RentalSystem.Web.Data;

public static class HealthCheckUtils
{
    public static Task WriteResponse(HttpContext context, HealthReport report)
    {
        context.Response.ContentType = "application/json; charset=utf-8";

        var options = new JsonWriterOptions { Indented = true };

        using var memoryStream = new MemoryStream();
        using (var writer = new Utf8JsonWriter(memoryStream, options))
        {
            writer.WriteStartObject();
            writer.WriteString("status", report.Status.ToString());
            writer.WriteString("duration", report.TotalDuration.ToString());
            
            writer.WriteStartObject("results");

            foreach (var entry in report.Entries)
            {
                writer.WriteStartObject(entry.Key);
                writer.WriteString("status", entry.Value.Status.ToString());
                writer.WriteString("description", entry.Value.Description);
                writer.WriteString("duration", entry.Value.Duration.ToString());
                
                if (entry.Value.Data.Any())
                {
                    writer.WriteStartObject("data");
                    foreach (var item in entry.Value.Data)
                    {
                        writer.WritePropertyName(item.Key);
                        JsonSerializer.Serialize(writer, item.Value);
                    }
                    writer.WriteEndObject();
                }
                
                writer.WriteEndObject();
            }

            writer.WriteEndObject();
            writer.WriteEndObject();
        }

        return context.Response.WriteAsync(System.Text.Encoding.UTF8.GetString(memoryStream.ToArray()));
    }
}
