using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MosaicTalent.Migrations
{
    /// <inheritdoc />
    public partial class AddPublicJobApplicationsAndJobsPageSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CompanyJobsPageSettings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<int>(type: "integer", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uuid", nullable: false),
                    HeroTitle = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: true),
                    HeroSubtitle = table.Column<string>(type: "character varying(600)", maxLength: 600, nullable: true),
                    HeroImageUrl = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: true),
                    PrimaryColor = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    LayoutJson = table.Column<string>(type: "character varying(12000)", maxLength: 12000, nullable: true),
                    ApplicationFormJson = table.Column<string>(type: "character varying(12000)", maxLength: 12000, nullable: true),
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
                    table.PrimaryKey("PK_CompanyJobsPageSettings", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PublicJobApplications",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<int>(type: "integer", nullable: false),
                    JobId = table.Column<Guid>(type: "uuid", nullable: false),
                    CandidateDeveloperId = table.Column<Guid>(type: "uuid", nullable: true),
                    FullName = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: true),
                    Email = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: true),
                    PhoneNumber = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    ResumeStoredFileId = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: true),
                    TechnicalAssessmentAnswer = table.Column<string>(type: "character varying(5000)", maxLength: 5000, nullable: true),
                    BehaviouralAssessmentAnswer = table.Column<string>(type: "character varying(5000)", maxLength: 5000, nullable: true),
                    ApplicationResponseJson = table.Column<string>(type: "character varying(12000)", maxLength: 12000, nullable: true),
                    Source = table.Column<int>(type: "integer", nullable: false),
                    MatchScore = table.Column<double>(type: "double precision", nullable: false),
                    MatchReason = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
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
                    table.PrimaryKey("PK_PublicJobApplications", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CompanyJobsPageSettings_TenantId_CompanyId",
                table: "CompanyJobsPageSettings",
                columns: new[] { "TenantId", "CompanyId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PublicJobApplications_TenantId_CandidateDeveloperId",
                table: "PublicJobApplications",
                columns: new[] { "TenantId", "CandidateDeveloperId" });

            migrationBuilder.CreateIndex(
                name: "IX_PublicJobApplications_TenantId_JobId_Email",
                table: "PublicJobApplications",
                columns: new[] { "TenantId", "JobId", "Email" });

            migrationBuilder.CreateIndex(
                name: "IX_PublicJobApplications_TenantId_JobId_Status",
                table: "PublicJobApplications",
                columns: new[] { "TenantId", "JobId", "Status" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CompanyJobsPageSettings");

            migrationBuilder.DropTable(
                name: "PublicJobApplications");
        }
    }
}
