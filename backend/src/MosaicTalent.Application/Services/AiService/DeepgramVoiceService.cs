using Abp.Dependency;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace MosaicTalent.Services.AiService;

public class DeepgramVoiceService : IDeepgramVoiceService, ITransientDependency
{
    private const string DeepgramSpeakEndpoint = "https://api.deepgram.com/v1/speak";
    private static readonly string[] VoiceModels =
    {
        "aura-2-thalia-en",
        "aura-2-asteria-en",
        "aura-2-luna-en",
        "aura-2-stella-en",
        "aura-2-athena-en",
        "aura-2-hera-en",
        "aura-2-orion-en",
        "aura-2-arcas-en",
        "aura-2-perseus-en",
        "aura-2-angus-en",
        "aura-2-orpheus-en",
        "aura-2-helios-en",
        "aura-2-zeus-en",
    };

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<DeepgramVoiceService> _logger;

    public DeepgramVoiceService(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<DeepgramVoiceService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
    }

    public bool IsConfigured()
    {
        return !string.IsNullOrWhiteSpace(_configuration["Deepgram:ApiKey"]);
    }

    public IReadOnlyList<string> GetAvailableVoiceModels()
    {
        return VoiceModels;
    }

    public async Task<(byte[] AudioBytes, string MimeType)> TrySynthesizeAsync(string text, string model = null)
    {
        if (!IsConfigured() || string.IsNullOrWhiteSpace(text))
        {
            return (null, null);
        }

        var apiKey = _configuration["Deepgram:ApiKey"];
        var resolvedModel = string.IsNullOrWhiteSpace(model)
            ? (_configuration["Deepgram:TtsModel"] ?? "aura-2-thalia-en")
            : model;
        const string fallbackModel = "aura-2-thalia-en";

        var client = _httpClientFactory.CreateClient();
        client.Timeout = TimeSpan.FromSeconds(20);

        try
        {
            var primaryResult = await SynthesizeAsync(client, apiKey, text, resolvedModel);
            if (primaryResult.AudioBytes != null && primaryResult.AudioBytes.Length > 0)
            {
                return primaryResult;
            }

            if (!string.Equals(resolvedModel, fallbackModel, StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogWarning("Deepgram TTS failed for model {Model}. Retrying with fallback model {FallbackModel}.", resolvedModel, fallbackModel);
                var fallbackResult = await SynthesizeAsync(client, apiKey, text, fallbackModel);
                if (fallbackResult.AudioBytes != null && fallbackResult.AudioBytes.Length > 0)
                {
                    return fallbackResult;
                }
            }

            return (null, null);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Deepgram TTS synthesis failed.");
            return (null, null);
        }
    }

    private async Task<(byte[] AudioBytes, string MimeType)> SynthesizeAsync(HttpClient client, string apiKey, string text, string model)
    {
        var endpoint = string.Format("{0}?model={1}", DeepgramSpeakEndpoint, Uri.EscapeDataString(model));
        using var request = new HttpRequestMessage(HttpMethod.Post, endpoint);
        request.Headers.Authorization = new AuthenticationHeaderValue("Token", apiKey);
        request.Content = new StringContent(
            JsonSerializer.Serialize(new { text }),
            Encoding.UTF8,
            "application/json");

        using var response = await client.SendAsync(request);
        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("Deepgram TTS returned status code {StatusCode} for model {Model}", response.StatusCode, model);
            return (null, null);
        }

        var bytes = await response.Content.ReadAsByteArrayAsync();
        if (bytes == null || bytes.Length == 0)
        {
            return (null, null);
        }

        var mimeType = response.Content.Headers.ContentType?.MediaType ?? "audio/mpeg";
        return (bytes, mimeType);
    }
}
