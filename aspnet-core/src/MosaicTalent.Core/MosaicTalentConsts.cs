using MosaicTalent.Debugging;

namespace MosaicTalent;

public class MosaicTalentConsts
{
    public const string LocalizationSourceName = "MosaicTalent";

    public const string ConnectionStringName = "Default";

    public const bool MultiTenancyEnabled = true;


    /// <summary>
    /// Default pass phrase for SimpleStringCipher decrypt/encrypt operations
    /// </summary>
    public static readonly string DefaultPassPhrase =
        DebugHelper.IsDebug ? "gsKxGZ012HLL3MI5" : "f46feacea7c34332bd5e814a5292c8ee";
}
