using Abp.Zero.EntityFrameworkCore;
using MosaicTalent.Authorization.Roles;
using MosaicTalent.Authorization.Users;
using MosaicTalent.Domains.Companies;
using MosaicTalent.Domains.Developers;
using MosaicTalent.Domains.Gamification;
using MosaicTalent.Domains.Notifications;
using MosaicTalent.Domains.Projects;
using MosaicTalent.Domains.Reviews;
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
    public DbSet<Job> Jobs { get; set; }
    public DbSet<JobApplication> JobApplications { get; set; }
    public DbSet<PublicJobApplication> PublicJobApplications { get; set; }
    public DbSet<JobAssessment> JobAssessments { get; set; }
    public DbSet<CompanyJobsPageSettings> CompanyJobsPageSettings { get; set; }
    public DbSet<Project> Projects { get; set; }
    public DbSet<ProjectMember> ProjectMembers { get; set; }
    public DbSet<ProjectSkill> ProjectSkills { get; set; }
    public DbSet<ProjectTask> ProjectTasks { get; set; }
    public DbSet<ProjectMeeting> ProjectMeetings { get; set; }
    public DbSet<ProjectMeetingReminderPreference> ProjectMeetingReminderPreferences { get; set; }
    public DbSet<ProjectTeamInvite> ProjectTeamInvites { get; set; }
    public DbSet<PeerReview> PeerReviews { get; set; }
    public DbSet<AIReviewQuestion> AIReviewQuestions { get; set; }
    public DbSet<AIReviewFeedback> AIReviewFeedbacks { get; set; }
    public DbSet<ReviewAnswer> ReviewAnswers { get; set; }
    public DbSet<SimulationScenario> SimulationScenarios { get; set; }
    public DbSet<SimulationScenarioRequiredRole> SimulationScenarioRequiredRoles { get; set; }
    public DbSet<SimulationSession> SimulationSessions { get; set; }
    public DbSet<ScenarioMessage> ScenarioMessages { get; set; }
    public DbSet<SimulationBot> SimulationBots { get; set; }
    public DbSet<OrchestratorLog> OrchestratorLogs { get; set; }
    public DbSet<AssessorObservation> AssessorObservations { get; set; }
    public DbSet<AssessorDimensionScore> AssessorDimensionScores { get; set; }
    public DbSet<PushSubscription> PushSubscriptions { get; set; }
    public DbSet<DeveloperEngagementProfile> DeveloperEngagementProfiles { get; set; }
    public DbSet<DeveloperEngagementBadge> DeveloperEngagementBadges { get; set; }
    public DbSet<DeveloperEngagementEvent> DeveloperEngagementEvents { get; set; }

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
            builder.HasIndex(x => x.GithubUsername).IsUnique()
                .HasFilter("\"GithubUsername\" IS NOT NULL AND \"IsDeleted\" = false");
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

        modelBuilder.Entity<Job>(builder =>
        {
            builder.HasIndex(x => new { x.TenantId, x.CompanyId, x.IsOpen });
            builder.HasIndex(x => new { x.CompanyId, x.CreationTime });
        });

        modelBuilder.Entity<JobApplication>(builder =>
        {
            builder.HasIndex(x => new { x.JobId, x.CandidateDeveloperId }).IsUnique();
            builder.HasIndex(x => new { x.TenantId, x.JobId, x.Status });
            builder.HasIndex(x => new { x.TenantId, x.CandidateDeveloperId });
        });

        modelBuilder.Entity<PublicJobApplication>(builder =>
        {
            builder.HasIndex(x => new { x.TenantId, x.JobId, x.Email });
            builder.HasIndex(x => new { x.TenantId, x.JobId, x.Status });
            builder.HasIndex(x => new { x.TenantId, x.CandidateDeveloperId });
        });

        modelBuilder.Entity<JobAssessment>(builder =>
        {
            builder.HasIndex(x => new { x.TenantId, x.JobId, x.Status });
            builder.HasIndex(x => new { x.TenantId, x.CandidateEmail });
            builder.HasIndex(x => x.JobApplicationId).IsUnique();
            builder.HasIndex(x => x.PublicJobApplicationId).IsUnique();
        });

        modelBuilder.Entity<CompanyJobsPageSettings>(builder =>
        {
            builder.HasIndex(x => new { x.TenantId, x.CompanyId }).IsUnique();
        });

        modelBuilder.Entity<Project>(builder =>
        {
            builder.HasIndex(x => new { x.TenantId, x.OwnerDeveloperId });
            builder.HasIndex(x => new { x.TenantId, x.Status });
            builder.HasIndex(x => new { x.TenantId, x.Difficulty });
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
            builder.HasIndex(x => new { x.ProjectId, x.AssignedDeveloperId });
        });

        modelBuilder.Entity<ProjectMeeting>(builder =>
        {
            builder.HasIndex(x => new { x.ProjectId, x.StartsAtUtc });
            builder.HasIndex(x => new { x.ProjectId, x.Status });
            builder.HasIndex(x => new { x.TenantId, x.ProjectId });
        });

        modelBuilder.Entity<ProjectMeetingReminderPreference>(builder =>
        {
            builder.HasIndex(x => new { x.MeetingId, x.DeveloperId }).IsUnique();
            builder.HasIndex(x => new { x.TenantId, x.DeveloperId });
        });

        modelBuilder.Entity<ProjectTeamInvite>(builder =>
        {
            builder.HasIndex(x => new { x.ProjectId, x.DeveloperId, x.Status });
            builder.HasIndex(x => new { x.TenantId, x.ProjectId, x.Status });
            builder.HasIndex(x => new { x.TenantId, x.DeveloperId, x.Status });
        });

        modelBuilder.Entity<PeerReview>(builder =>
        {
            builder.HasIndex(x => new { x.ProjectId, x.ReviewerDeveloperId, x.RevieweeDeveloperId }).IsUnique();
            builder.HasIndex(x => new { x.TenantId, x.ReviewerDeveloperId });
            builder.HasIndex(x => new { x.TenantId, x.RevieweeDeveloperId });
        });

        modelBuilder.Entity<AIReviewQuestion>(builder =>
        {
            builder.HasIndex(x => new { x.PeerReviewId, x.Category });
            builder.HasIndex(x => new { x.TenantId, x.PeerReviewId });
        });

        modelBuilder.Entity<AIReviewFeedback>(builder =>
        {
            builder.HasIndex(x => new { x.ProjectId }).IsUnique();
            builder.HasIndex(x => new { x.TenantId, x.ProjectId });
        });

        modelBuilder.Entity<ReviewAnswer>(builder =>
        {
            builder.HasIndex(x => new { x.AIReviewQuestionId }).IsUnique();
            builder.HasIndex(x => new { x.TenantId, x.AIReviewQuestionId });
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

        modelBuilder.Entity<PushSubscription>(builder =>
        {
            builder.HasIndex(x => new { x.TenantId, x.UserId, x.Endpoint }).IsUnique();
            builder.HasIndex(x => new { x.TenantId, x.UserId, x.IsActive });
        });

        modelBuilder.Entity<DeveloperEngagementProfile>(builder =>
        {
            builder.HasIndex(x => new { x.TenantId, x.DeveloperId }).IsUnique();
            builder.HasIndex(x => new { x.TenantId, x.TotalPoints });
        });

        modelBuilder.Entity<DeveloperEngagementBadge>(builder =>
        {
            builder.HasIndex(x => new { x.TenantId, x.DeveloperId, x.BadgeCode }).IsUnique();
            builder.HasIndex(x => new { x.TenantId, x.DeveloperId, x.EarnedAt });
        });

        modelBuilder.Entity<DeveloperEngagementEvent>(builder =>
        {
            builder.HasIndex(x => new { x.TenantId, x.DeveloperId, x.EventKey }).IsUnique();
            builder.HasIndex(x => new { x.TenantId, x.DeveloperId, x.OccurredAt });
        });
    }
}
