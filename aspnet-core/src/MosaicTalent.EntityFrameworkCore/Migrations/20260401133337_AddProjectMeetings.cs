using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MosaicTalent.Migrations
{
    /// <inheritdoc />
    public partial class AddProjectMeetings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "AssignedDeveloperId",
                table: "ProjectTasks",
                type: "uuid",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "Projects",
                type: "character varying(8000)",
                maxLength: 8000,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(2000)",
                oldMaxLength: 2000);

            migrationBuilder.AddColumn<int>(
                name: "Difficulty",
                table: "Projects",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "EstimatedHoursPerWeek",
                table: "Projects",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "LastRepoSafetyCommitSha",
                table: "Projects",
                type: "character varying(80)",
                maxLength: 80,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LastRepoSafetyRiskLevel",
                table: "Projects",
                type: "character varying(40)",
                maxLength: 40,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastRepoSafetyScanAtUtc",
                table: "Projects",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LastUnsafeAlertCommitSha",
                table: "Projects",
                type: "character varying(80)",
                maxLength: 80,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ProjectMeetingReminderPreferences",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<int>(type: "integer", nullable: false),
                    MeetingId = table.Column<Guid>(type: "uuid", nullable: false),
                    DeveloperId = table.Column<Guid>(type: "uuid", nullable: false),
                    MinutesBefore = table.Column<int>(type: "integer", nullable: false),
                    LastTriggeredAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    CreationTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastModifierUserId = table.Column<long>(type: "bigint", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeleterUserId = table.Column<long>(type: "bigint", nullable: true),
                    DeletionTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProjectMeetingReminderPreferences", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ProjectMeetings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<int>(type: "integer", nullable: false),
                    ProjectId = table.Column<Guid>(type: "uuid", nullable: false),
                    RequestedByDeveloperId = table.Column<Guid>(type: "uuid", nullable: false),
                    ScheduledByDeveloperId = table.Column<Guid>(type: "uuid", nullable: true),
                    Title = table.Column<string>(type: "character varying(180)", maxLength: 180, nullable: false),
                    Agenda = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    JitsiRoomName = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    StartsAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EndsAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    CreationTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastModifierUserId = table.Column<long>(type: "bigint", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeleterUserId = table.Column<long>(type: "bigint", nullable: true),
                    DeletionTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProjectMeetings", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProjectTasks_ProjectId_AssignedDeveloperId",
                table: "ProjectTasks",
                columns: new[] { "ProjectId", "AssignedDeveloperId" });

            migrationBuilder.CreateIndex(
                name: "IX_Projects_TenantId_Difficulty",
                table: "Projects",
                columns: new[] { "TenantId", "Difficulty" });

            migrationBuilder.CreateIndex(
                name: "IX_ProjectMeetingReminderPreferences_MeetingId_DeveloperId",
                table: "ProjectMeetingReminderPreferences",
                columns: new[] { "MeetingId", "DeveloperId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProjectMeetingReminderPreferences_TenantId_DeveloperId",
                table: "ProjectMeetingReminderPreferences",
                columns: new[] { "TenantId", "DeveloperId" });

            migrationBuilder.CreateIndex(
                name: "IX_ProjectMeetings_ProjectId_StartsAtUtc",
                table: "ProjectMeetings",
                columns: new[] { "ProjectId", "StartsAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_ProjectMeetings_ProjectId_Status",
                table: "ProjectMeetings",
                columns: new[] { "ProjectId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_ProjectMeetings_TenantId_ProjectId",
                table: "ProjectMeetings",
                columns: new[] { "TenantId", "ProjectId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ProjectMeetingReminderPreferences");

            migrationBuilder.DropTable(
                name: "ProjectMeetings");

            migrationBuilder.DropIndex(
                name: "IX_ProjectTasks_ProjectId_AssignedDeveloperId",
                table: "ProjectTasks");

            migrationBuilder.DropIndex(
                name: "IX_Projects_TenantId_Difficulty",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "AssignedDeveloperId",
                table: "ProjectTasks");

            migrationBuilder.DropColumn(
                name: "Difficulty",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "EstimatedHoursPerWeek",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "LastRepoSafetyCommitSha",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "LastRepoSafetyRiskLevel",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "LastRepoSafetyScanAtUtc",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "LastUnsafeAlertCommitSha",
                table: "Projects");

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "Projects",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(8000)",
                oldMaxLength: 8000);
        }
    }
}
