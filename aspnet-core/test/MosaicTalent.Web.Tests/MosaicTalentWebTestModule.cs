using Abp.AspNetCore;
using Abp.AspNetCore.TestBase;
using Abp.Modules;
using Abp.Reflection.Extensions;
using MosaicTalent.EntityFrameworkCore;
using MosaicTalent.Web.Startup;
using Microsoft.AspNetCore.Mvc.ApplicationParts;

namespace MosaicTalent.Web.Tests;

[DependsOn(
    typeof(MosaicTalentWebMvcModule),
    typeof(AbpAspNetCoreTestBaseModule)
)]
public class MosaicTalentWebTestModule : AbpModule
{
    public MosaicTalentWebTestModule(MosaicTalentEntityFrameworkModule abpProjectNameEntityFrameworkModule)
    {
        abpProjectNameEntityFrameworkModule.SkipDbContextRegistration = true;
    }

    public override void PreInitialize()
    {
        Configuration.UnitOfWork.IsTransactional = false; //EF Core InMemory DB does not support transactions.
    }

    public override void Initialize()
    {
        IocManager.RegisterAssemblyByConvention(typeof(MosaicTalentWebTestModule).GetAssembly());
    }

    public override void PostInitialize()
    {
        IocManager.Resolve<ApplicationPartManager>()
            .AddApplicationPartsIfNotAddedBefore(typeof(MosaicTalentWebMvcModule).Assembly);
    }
}