using Abp.Zero.EntityFrameworkCore;
using MosaicTalent.Authorization.Roles;
using MosaicTalent.Authorization.Users;
using MosaicTalent.Domains.Companies;
using MosaicTalent.Domains.Developers;
using MosaicTalent.Domains.Projects;
using MosaicTalent.Domains.Simulations;
using MosaicTalent.MultiTenancy;
using Microsoft.EntityFrameworkCore;

namespace MosaicTalent.EntityFrameworkCore;

public class MosaicTalentDbContext : AbpZeroDbContext<Tenant, Role, User, MosaicTalentDbContext>
{
    public DbSet<Developer> Developers { get; set; }
    public DbSet<DeveloperProfile> DeveloperProfiles { get; set; }
    public DbSet<DeveloperProfileSkill> DeveloperProfileSkills { get; set; }
    public DbSet<DeveloperProfileGoal> DeveloperProfileGoals { get; set; }
    public DbSet<Company> Companies { get; set; }
    public DbSet<CompanyEmployee> CompanyEmployees { get; set; }
    public DbSet<Project> Projects { get; set; }
    public DbSet<ProjectMember> ProjectMembers { get; set; }
    public DbSet<ProjectSkill> ProjectSkills { get; set; }
    public DbSet<ProjectTask> ProjectTasks { get; set; }
    public DbSet<SimulationScenario> SimulationScenarios { get; set; }
    public DbSet<SimulationScenarioRequiredRole> SimulationScenarioRequiredRoles { get; set; }
    public DbSet<SimulationSession> SimulationSessions { get; set; }
    public DbSet<ScenarioMessage> ScenarioMessages { get; set; }
    public DbSet<SimulationBot> SimulationBots { get; set; }
    public DbSet<OrchestratorLog> OrchestratorLogs { get; set; }
    public DbSet<AssessorObservation> AssessorObservations { get; set; }
    public DbSet<AssessorDimensionScore> AssessorDimensionScores { get; set; }

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

        modelBuilder.Entity<Company>(builder =>
        {
            builder.HasIndex(x => x.TenantId).IsUnique();
            builder.HasIndex(x => x.TenancyName).IsUnique();
            builder.HasIndex(x => x.AccountOwnerUserId);
        });

        modelBuilder.Entity<CompanyEmployee>(builder =>
        {
            builder.HasIndex(x => new { x.TenantId, x.UserId }).IsUnique();
            builder.HasIndex(x => new { x.CompanyId, x.Role });
        });

        modelBuilder.Entity<Project>(builder =>
        {
            builder.HasIndex(x => new { x.TenantId, x.OwnerDeveloperId });
            builder.HasIndex(x => new { x.TenantId, x.Status });
        });

        modelBuilder.Entity<ProjectMember>(builder =>
        {
            builder.HasIndex(x => new { x.ProjectId, x.DeveloperId }).IsUnique();
            builder.HasIndex(x => new { x.TenantId, x.DeveloperId });
        });

        modelBuilder.Entity<ProjectSkill>(builder =>
        {
            builder.HasIndex(x => new { x.ProjectId, x.Name }).IsUnique();
            builder.HasIndex(x => new { x.TenantId, x.ProjectId });
        });

        modelBuilder.Entity<ProjectTask>(builder =>
        {
            builder.HasIndex(x => new { x.ProjectId, x.Status });
            builder.HasIndex(x => new { x.TenantId, x.ProjectId });
        });

        modelBuilder.Entity<SimulationScenario>(builder =>
        {
            builder.HasIndex(x => new { x.TenantId, x.Title });
        });

        modelBuilder.Entity<SimulationScenarioRequiredRole>(builder =>
        {
            builder.HasIndex(x => new { x.ScenarioId, x.Role }).IsUnique();
            builder.HasIndex(x => new { x.TenantId, x.ScenarioId });
        });

        modelBuilder.Entity<SimulationSession>(builder =>
        {
            builder.HasIndex(x => new { x.TenantId, x.ScenarioId });
            builder.HasIndex(x => new { x.TenantId, x.CreationTime });
        });

        modelBuilder.Entity<ScenarioMessage>(builder =>
        {
            builder.HasIndex(x => new { x.SessionId, x.CreationTime });
            builder.HasIndex(x => new { x.TenantId, x.SessionId });
        });

        modelBuilder.Entity<SimulationBot>(builder =>
        {
            builder.HasIndex(x => new { x.SessionId, x.Role }).IsUnique();
            builder.HasIndex(x => new { x.TenantId, x.SessionId, x.TurnOrder });
        });

        modelBuilder.Entity<OrchestratorLog>(builder =>
        {
            builder.HasIndex(x => new { x.SessionId, x.TurnIndex });
            builder.HasIndex(x => new { x.TenantId, x.SessionId });
        });

        modelBuilder.Entity<AssessorObservation>(builder =>
        {
            builder.HasIndex(x => new { x.SessionId, x.TurnIndex });
            builder.HasIndex(x => new { x.TenantId, x.SessionId });
        });

        modelBuilder.Entity<AssessorDimensionScore>(builder =>
        {
            builder.HasIndex(x => new { x.ObservationId, x.Dimension }).IsUnique();
        });
    }
}
