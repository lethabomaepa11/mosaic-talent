using System;
using System.Linq;
using System.Text.RegularExpressions;

namespace MosaicTalent.Authorization.Accounts.Dto;

public static class RegistrationDetails
{
    public static (string Name, string Surname) SplitFullName(string fullName)
    {
        var parts = (fullName ?? string.Empty).Split((char[])null, StringSplitOptions.RemoveEmptyEntries);
        return (parts.FirstOrDefault() ?? string.Empty, string.Join(" ", parts.Skip(1)));
    }

    public static string UsernamePrefix(string name)
    {
        var prefix = Regex.Replace((name ?? string.Empty).ToLowerInvariant(), "[^a-z0-9]", string.Empty);
        return string.IsNullOrEmpty(prefix) ? "developer" : prefix.Substring(0, Math.Min(32, prefix.Length));
    }

    public static bool IsStrongPassword(string password)
    {
        return password != null && password.Length >= 8 && !password.Any(char.IsWhiteSpace)
            && password.Any(char.IsUpper) && password.Any(char.IsLower)
            && password.Any(char.IsDigit) && password.Any(c => !char.IsLetterOrDigit(c));
    }
}
