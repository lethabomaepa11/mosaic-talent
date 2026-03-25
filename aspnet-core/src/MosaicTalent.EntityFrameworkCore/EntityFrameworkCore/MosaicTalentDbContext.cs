using Abp.Zero.EntityFrameworkCore;
using MosaicTalent.Authorization.Roles;
using MosaicTalent.Authorization.Users;
using MosaicTalent.Domains.Developers;
using MosaicTalent.MultiTenancy;
using Microsoft.EntityFrameworkCore;

namespace MosaicTalent.EntityFrameworkCore;

public class MosaicTalentDbContext : AbpZeroDbContext<Tenant, Role, User, MosaicTalentDbContext>
{
    public DbSet<Developer> Developers { get; set; }
    public DbSet<DeveloperProfile> DeveloperProfiles { get; set; }
    public DbSet<DeveloperProfileSkill> DeveloperProfileSkills { get; set; }
    public DbSet<DeveloperProfileGoal> DeveloperProfileGoals { get; set; }

    public MosaicTalentDbContext(DbContextOptions<MosaicTalentDbContext> options)
        : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Developer>(builder =>
        {
            builder.HasIndex(x => x.UserId).IsUnique();
        });

        modelBuilder.Entity<DeveloperProfile>(builder =>
        {
            builder.HasIndex(x => x.DeveloperId).IsUnique();
        });

        modelBuilder.Entity<DeveloperProfileSkill>(builder =>
        {
            builder.HasIndex(x => new { x.ProfileId, x.Name }).IsUnique();
        });

        modelBuilder.Entity<DeveloperProfileGoal>(builder =>
        {
            builder.HasIndex(x => new { x.ProfileId, x.Goal }).IsUnique();
        });
    }
}
