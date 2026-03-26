using System.Text.Json.Serialization;

namespace MosaicTalent.Models.TokenAuth
{
    public class GitHubOAuthUserResponse
    {
        public string Login { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }

        [JsonPropertyName("avatar_url")]
        public string AvatarUrl { get; set; }
    }
}
