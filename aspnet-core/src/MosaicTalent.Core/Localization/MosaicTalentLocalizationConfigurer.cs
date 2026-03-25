using Abp.Configuration.Startup;
using Abp.Localization.Dictionaries;
using Abp.Localization.Dictionaries.Xml;
using Abp.Reflection.Extensions;

namespace MosaicTalent.Localization;

public static class MosaicTalentLocalizationConfigurer
{
    public static void Configure(ILocalizationConfiguration localizationConfiguration)
    {
        localizationConfiguration.Sources.Add(
            new DictionaryBasedLocalizationSource(MosaicTalentConsts.LocalizationSourceName,
                new XmlEmbeddedFileLocalizationDictionaryProvider(
                    typeof(MosaicTalentLocalizationConfigurer).GetAssembly(),
                    "MosaicTalent.Localization.SourceFiles"
                )
            )
        );
    }
}
