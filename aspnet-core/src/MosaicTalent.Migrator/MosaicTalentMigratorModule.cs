using Abp.Events.Bus;
using Abp.Modules;
using Abp.Reflection.Extensions;
using MosaicTalent.Configuration;
using MosaicTalent.EntityFrameworkCore;
using MosaicTalent.Migrator.DependencyInjection;
using Castle.MicroKernel.Registration;
using Microsoft.Extensions.Configuration;

namespace MosaicTalent.Migrator;

[DependsOn(typeof(MosaicTalentEntityFrameworkModule))]
public class MosaicTalentMigratorModule : AbpModule
{
    private readonly IConfigurationRoot _appConfiguration;

    public MosaicTalentMigratorModule(MosaicTalentEntityFrameworkModule abpProjectNameEntityFrameworkModule)
    {
        abpProjectNameEntityFrameworkModule.SkipDbSeed = true;

        _appConfiguration = AppConfigurations.Get(
            typeof(MosaicTalentMigratorModule).GetAssembly().GetDirectoryPathOrNull()
        );
    }

    public override void PreInitialize()
    {
        Configuration.DefaultNameOrConnectionString = _appConfiguration.GetConnectionString(
            MosaicTalentConsts.ConnectionStringName
        );

        Configuration.BackgroundJobs.IsJobExecutionEnabled = false;
        Configuration.ReplaceService(
            typeof(IEventBus),
            () => IocManager.IocContainer.Register(
                Component.For<IEventBus>().Instance(NullEventBus.Instance)
            )
        );
    }

    public override void Initialize()
    {
        IocManager.RegisterAssemblyByConvention(typeof(MosaicTalentMigratorModule).GetAssembly());
        ServiceCollectionRegistrar.Register(IocManager);
    }
}
