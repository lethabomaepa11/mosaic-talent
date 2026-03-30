using System.Threading.Tasks;
using System.Collections.Generic;

namespace MosaicTalent.Services.AiService;

public interface IDeepgramVoiceService
{
    bool IsConfigured();
    IReadOnlyList<string> GetAvailableVoiceModels();
    Task<(byte[] AudioBytes, string MimeType)> TrySynthesizeAsync(string text, string model = null);
}
