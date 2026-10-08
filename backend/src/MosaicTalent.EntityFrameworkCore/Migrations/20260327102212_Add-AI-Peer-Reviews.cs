using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MosaicTalent.Migrations
{
    /// <inheritdoc />
    public partial class AddAIPeerReviews : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AIReviewFeedbacks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<int>(type: "integer", nullable: false),
                    ProjectId = table.Column<Guid>(type: "uuid", nullable: false),
                    Summary = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    StrengthsJson = table.Column<string>(type: "character varying(6000)", maxLength: 6000, nullable: false),
                    ImprovementAreasJson = table.Column<string>(type: "character varying(6000)", maxLength: 6000, nullable: false),
                    TipsJson = table.Column<string>(type: "character varying(6000)", maxLength: 6000, nullable: false),
                    GrowthScore = table.Column<int>(type: "integer", nullable: false),
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
                    table.PrimaryKey("PK_AIReviewFeedbacks", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AIReviewQuestions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<int>(type: "integer", nullable: false),
                    PeerReviewId = table.Column<Guid>(type: "uuid", nullable: false),
                    Text = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Type = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    RelatedGoal = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Category = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
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
                    table.PrimaryKey("PK_AIReviewQuestions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PeerReviews",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<int>(type: "integer", nullable: false),
                    ProjectId = table.Column<Guid>(type: "uuid", nullable: false),
                    ReviewerDeveloperId = table.Column<Guid>(type: "uuid", nullable: false),
                    RevieweeDeveloperId = table.Column<Guid>(type: "uuid", nullable: false),
                    Rating = table.Column<int>(type: "integer", nullable: false),
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
                    table.PrimaryKey("PK_PeerReviews", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ReviewAnswers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<int>(type: "integer", nullable: false),
                    AIReviewQuestionId = table.Column<Guid>(type: "uuid", nullable: false),
                    Text = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
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
                    table.PrimaryKey("PK_ReviewAnswers", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AIReviewFeedbacks_ProjectId",
                table: "AIReviewFeedbacks",
                column: "ProjectId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AIReviewFeedbacks_TenantId_ProjectId",
                table: "AIReviewFeedbacks",
                columns: new[] { "TenantId", "ProjectId" });

            migrationBuilder.CreateIndex(
                name: "IX_AIReviewQuestions_PeerReviewId_Category",
                table: "AIReviewQuestions",
                columns: new[] { "PeerReviewId", "Category" });

            migrationBuilder.CreateIndex(
                name: "IX_AIReviewQuestions_TenantId_PeerReviewId",
                table: "AIReviewQuestions",
                columns: new[] { "TenantId", "PeerReviewId" });

            migrationBuilder.CreateIndex(
                name: "IX_PeerReviews_ProjectId_ReviewerDeveloperId_RevieweeDeveloper~",
                table: "PeerReviews",
                columns: new[] { "ProjectId", "ReviewerDeveloperId", "RevieweeDeveloperId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PeerReviews_TenantId_RevieweeDeveloperId",
                table: "PeerReviews",
                columns: new[] { "TenantId", "RevieweeDeveloperId" });

            migrationBuilder.CreateIndex(
                name: "IX_PeerReviews_TenantId_ReviewerDeveloperId",
                table: "PeerReviews",
                columns: new[] { "TenantId", "ReviewerDeveloperId" });

            migrationBuilder.CreateIndex(
                name: "IX_ReviewAnswers_AIReviewQuestionId",
                table: "ReviewAnswers",
                column: "AIReviewQuestionId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ReviewAnswers_TenantId_AIReviewQuestionId",
                table: "ReviewAnswers",
                columns: new[] { "TenantId", "AIReviewQuestionId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AIReviewFeedbacks");

            migrationBuilder.DropTable(
                name: "AIReviewQuestions");

            migrationBuilder.DropTable(
                name: "PeerReviews");

            migrationBuilder.DropTable(
                name: "ReviewAnswers");
        }
    }
}
