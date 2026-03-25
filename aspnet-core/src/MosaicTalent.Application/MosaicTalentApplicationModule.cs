using Abp.AutoMapper;
using Abp.Modules;
using Abp.Reflection.Extensions;
using MosaicTalent.Authorization;

namespace MosaicTalent;

[DependsOn(
    typeof(MosaicTalentCoreModule),
    typeof(AbpAutoMapperModule))]
public class MosaicTalentApplicationModule : AbpModule
{
    public override void PreInitialize()
    {
        Configuration.Authorization.Providers.Add<MosaicTalentAuthorizationProvider>();
    }

    public override void Initialize()
    {
        var thisAssembly = typeof(MosaicTalentApplicationModule).GetAssembly();

        IocManager.RegisterAssemblyByConvention(thisAssembly);

        Configuration.Modules.AbpAutoMapper().Configurators.Add(
            // Scan the assembly for classes which inherit from AutoMapper.Profile
            cfg => cfg.AddMaps(thisAssembly)
        );
    }
}
