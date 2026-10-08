using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MosaicTalent.Migrations
{
    /// <inheritdoc />
    public partial class AddGamificationModels : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DeveloperEngagementBadges",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<int>(type: "integer", nullable: false),
                    DeveloperId = table.Column<Guid>(type: "uuid", nullable: false),
                    BadgeCode = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Name = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    Description = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: true),
                    EarnedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
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
                    table.PrimaryKey("PK_DeveloperEngagementBadges", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "DeveloperEngagementEvents",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<int>(type: "integer", nullable: false),
                    DeveloperId = table.Column<Guid>(type: "uuid", nullable: false),
                    EventType = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    EventKey = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    PointsAwarded = table.Column<int>(type: "integer", nullable: false),
                    MetadataJson = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    OccurredAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
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
                    table.PrimaryKey("PK_DeveloperEngagementEvents", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "DeveloperEngagementProfiles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<int>(type: "integer", nullable: false),
                    DeveloperId = table.Column<Guid>(type: "uuid", nullable: false),
                    TotalPoints = table.Column<int>(type: "integer", nullable: false),
                    Level = table.Column<int>(type: "integer", nullable: false),
                    LastRewardedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
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
                    table.PrimaryKey("PK_DeveloperEngagementProfiles", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DeveloperEngagementBadges_TenantId_DeveloperId_BadgeCode",
                table: "DeveloperEngagementBadges",
                columns: new[] { "TenantId", "DeveloperId", "BadgeCode" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DeveloperEngagementBadges_TenantId_DeveloperId_EarnedAt",
                table: "DeveloperEngagementBadges",
                columns: new[] { "TenantId", "DeveloperId", "EarnedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_DeveloperEngagementEvents_TenantId_DeveloperId_EventKey",
                table: "DeveloperEngagementEvents",
                columns: new[] { "TenantId", "DeveloperId", "EventKey" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DeveloperEngagementEvents_TenantId_DeveloperId_OccurredAt",
                table: "DeveloperEngagementEvents",
                columns: new[] { "TenantId", "DeveloperId", "OccurredAt" });

            migrationBuilder.CreateIndex(
                name: "IX_DeveloperEngagementProfiles_TenantId_DeveloperId",
                table: "DeveloperEngagementProfiles",
                columns: new[] { "TenantId", "DeveloperId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DeveloperEngagementProfiles_TenantId_TotalPoints",
                table: "DeveloperEngagementProfiles",
                columns: new[] { "TenantId", "TotalPoints" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DeveloperEngagementBadges");

            migrationBuilder.DropTable(
                name: "DeveloperEngagementEvents");

            migrationBuilder.DropTable(
                name: "DeveloperEngagementProfiles");
        }
    }
}
