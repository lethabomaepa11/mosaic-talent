using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MosaicTalent.Migrations
{
    /// <inheritdoc />
    public partial class AddJobAssessment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "JobAssessments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<int>(type: "integer", nullable: false),
                    JobId = table.Column<Guid>(type: "uuid", nullable: false),
                    JobApplicationId = table.Column<Guid>(type: "uuid", nullable: true),
                    PublicJobApplicationId = table.Column<Guid>(type: "uuid", nullable: true),
                    CandidateName = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: true),
                    CandidateEmail = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: true),
                    Prompt = table.Column<string>(type: "character varying(5000)", maxLength: 5000, nullable: true),
                    Instructions = table.Column<string>(type: "character varying(5000)", maxLength: 5000, nullable: true),
                    ContextJson = table.Column<string>(type: "character varying(12000)", maxLength: 12000, nullable: true),
                    SubmissionText = table.Column<string>(type: "character varying(20000)", maxLength: 20000, nullable: true),
                    SubmissionGithubRepo = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: true),
                    AssessmentResultJson = table.Column<string>(type: "character varying(12000)", maxLength: 12000, nullable: true),
                    Score = table.Column<double>(type: "double precision", nullable: false),
                    Verdict = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    SubmittedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
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
                    table.PrimaryKey("PK_JobAssessments", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_JobAssessments_JobApplicationId",
                table: "JobAssessments",
                column: "JobApplicationId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_JobAssessments_PublicJobApplicationId",
                table: "JobAssessments",
                column: "PublicJobApplicationId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_JobAssessments_TenantId_CandidateEmail",
                table: "JobAssessments",
                columns: new[] { "TenantId", "CandidateEmail" });

            migrationBuilder.CreateIndex(
                name: "IX_JobAssessments_TenantId_JobId_Status",
                table: "JobAssessments",
                columns: new[] { "TenantId", "JobId", "Status" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "JobAssessments");
        }
    }
}
