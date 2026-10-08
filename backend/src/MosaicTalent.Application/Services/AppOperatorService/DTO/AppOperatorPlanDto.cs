using System.Collections.Generic;

namespace MosaicTalent.Services.AppOperatorService.DTO;

public class AppOperatorPlanDto
{
    public string Mode { get; set; } = "execute";

    public string Type { get; set; } = "navigate";

    public string RouteKey { get; set; }

    public Dictionary<string, string> Params { get; set; } = new();

    public List<string> MissingRequired { get; set; } = new();

    public bool RequiresConfirmation { get; set; }

    public string Narration { get; set; }

    public string AssistantReply { get; set; }

    public bool ShouldOfferExecution { get; set; }

    public List<AppOperatorPlanStepDto> Steps { get; set; } = new();

    public bool UsedAi { get; set; }
}
