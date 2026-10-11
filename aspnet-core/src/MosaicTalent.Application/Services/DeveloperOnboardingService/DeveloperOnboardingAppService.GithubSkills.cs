using Abp.Runtime.Security;
using Abp.UI;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MosaicTalent.Services.DeveloperOnboardingService;

public partial class DeveloperOnboardingAppService
{
    public GithubSkillSuggestionService GithubSkills { get; set; }

    public async Task<List<string>> GetGithubSkillSuggestions()
    {
        var userId = AbpSession.UserId ?? throw new UserFriendlyException("User must be logged in.");
        var developer = await _developerRepository.GetAll().FirstOrDefaultAsync(x => x.UserId == userId);
        if (developer == null || string.IsNullOrWhiteSpace(developer.GithubAccessTokenEncrypted))
        {
            return new List<string>();
        }
        return await GithubSkills.GetSuggestionsAsync(SimpleStringCipher.Instance.Decrypt(developer.GithubAccessTokenEncrypted));
    }
}
