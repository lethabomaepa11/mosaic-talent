using System.Threading.Tasks;

namespace MosaicTalent.Services.AiService;

public interface IGroqChatService
{
    bool IsConfigured();
    Task<string> TryCompleteAsync(string systemPrompt, string userPrompt);
}
