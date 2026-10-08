using Abp.Dependency;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace MosaicTalent.Services.AiService;

public class GroqChatService : IGroqChatService, ITransientDependency
{
    private const string GroqEndpoint = "https://api.groq.com/openai/v1/chat/completions";
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<GroqChatService> _logger;

    public GroqChatService(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<GroqChatService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
    }

    public bool IsConfigured()
    {
        return !string.IsNullOrWhiteSpace(_configuration["Groq:ApiKey"]);
    }

    public async Task<string> TryCompleteAsync(string systemPrompt, string userPrompt)
    {
        if (!IsConfigured())
        {
            return null;
        }

        var apiKey = _configuration["Groq:ApiKey"];
        var model = _configuration["Groq:Model"] ?? "llama-3.3-70b-versatile";

        var payload = new
        {
            model,
            temperature = 0.2,
            messages = new object[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user", content = userPrompt },
            },
            response_format = new
            {
                type = "json_object"
            }
        };

        var client = _httpClientFactory.CreateClient();
        client.Timeout = TimeSpan.FromSeconds(20);

        using var request = new HttpRequestMessage(HttpMethod.Post, GroqEndpoint);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        request.Content = new StringContent(
            JsonSerializer.Serialize(payload),
            Encoding.UTF8,
            "application/json");

        try
        {
            using var response = await client.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Groq returned non-success status: {StatusCode}", response.StatusCode);
                return null;
            }

            var body = await response.Content.ReadAsStringAsync();
            using var document = JsonDocument.Parse(body);
            if (!document.RootElement.TryGetProperty("choices", out var choices) || choices.GetArrayLength() == 0)
            {
                return null;
            }

            var content = choices[0].GetProperty("message").GetProperty("content").GetString();
            return string.IsNullOrWhiteSpace(content) ? null : content;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Groq completion failed.");
            return null;
        }
    }
}
