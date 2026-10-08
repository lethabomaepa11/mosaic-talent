using MosaicTalent.Services.SimulationScenarioService.DTO;

namespace MosaicTalent.Services.SimulationVoiceService.DTO;

public class SimulationVoiceTurnDto
{
    public SimulationSessionDto Session { get; set; }
    public string ReplyText { get; set; }
    public string ReplyRole { get; set; }
    public string ReplyMessageId { get; set; }
    public string VoiceModel { get; set; }
    public string AudioBase64 { get; set; }
    public string AudioMimeType { get; set; }
}
