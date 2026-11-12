using System;
using System.Linq;
using System.Text.RegularExpressions;

namespace MosaicTalent.Services.PeerReviewService;

public static class PeerReviewQuestionText
{
    public static string Sanitize(string text, string projectTitle, params string[] knownNames)
    {
        if (string.IsNullOrWhiteSpace(text)) return text;
        // The project is already identified by the surrounding screen; keep questions readable
        // when project titles share words with a participant's name.
        if (!string.IsNullOrWhiteSpace(projectTitle))
            text = text.Replace(projectTitle, "this project", StringComparison.OrdinalIgnoreCase);
        var names = knownNames.Where(name => !string.IsNullOrWhiteSpace(name))
            .SelectMany(name => new[] { name.Trim() }.Concat(name.Split(' ', StringSplitOptions.RemoveEmptyEntries).Where(part => part.Length > 2)))
            .Distinct(StringComparer.OrdinalIgnoreCase).OrderByDescending(name => name.Length).ToList();
        if (names.Count == 0) return text;
        var protectedPhrases = new[] { "your anonymous teammate", "anonymous teammate", "your teammate", "this project" };
        var pattern = @"(?<![\p{L}\p{N}_])(?:" + string.Join("|", protectedPhrases.Concat(names).Select(Regex.Escape)) + @")(?![\p{L}\p{N}_])";
        return Regex.Replace(text, pattern, match => protectedPhrases.Contains(match.Value, StringComparer.OrdinalIgnoreCase)
            ? match.Value : "your anonymous teammate", RegexOptions.IgnoreCase, TimeSpan.FromSeconds(1));
    }
}
