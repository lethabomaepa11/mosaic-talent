using Abp.Zero.EntityFrameworkCore;
using MosaicTalent.Authorization.Roles;
using MosaicTalent.Authorization.Users;
using MosaicTalent.MultiTenancy;
using Microsoft.EntityFrameworkCore;

namespace MosaicTalent.EntityFrameworkCore;

public class MosaicTalentDbContext : AbpZeroDbContext<Tenant, Role, User, MosaicTalentDbContext>
{
    /* Define a DbSet for each entity of the application */

    public MosaicTalentDbContext(DbContextOptions<MosaicTalentDbContext> options)
        : base(options)
    {
    }
}
