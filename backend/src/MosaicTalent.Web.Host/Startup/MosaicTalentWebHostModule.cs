using Abp.Modules;
using Abp.Reflection.Extensions;
using MosaicTalent.Configuration;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;

namespace MosaicTalent.Web.Host.Startup
{
    [DependsOn(
       typeof(MosaicTalentWebCoreModule))]
    public class MosaicTalentWebHostModule : AbpModule
    {
        private readonly IWebHostEnvironment _env;
        private readonly IConfigurationRoot _appConfiguration;

        public MosaicTalentWebHostModule(IWebHostEnvironment env)
        {
            _env = env;
            _appConfiguration = env.GetAppConfiguration();
        }

        public override void Initialize()
        {
            IocManager.RegisterAssemblyByConvention(typeof(MosaicTalentWebHostModule).GetAssembly());
        }
    }
}
