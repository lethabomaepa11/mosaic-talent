using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MosaicTalent.Migrations
{
    /// <inheritdoc />
    public partial class DocumentProjectWorkEvidence : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsMentor",
                table: "ProjectMembers",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "ProjectProgressEntries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<int>(type: "integer", nullable: false),
                    ProjectId = table.Column<Guid>(type: "uuid", nullable: false),
                    DeveloperId = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    Summary = table.Column<string>(type: "character varying(3000)", maxLength: 3000, nullable: false),
                    EvidenceUrl = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: false),
                    SelfReview = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
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
                    table.PrimaryKey("PK_ProjectProgressEntries", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ProjectProgressReviews",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<int>(type: "integer", nullable: false),
                    EntryId = table.Column<Guid>(type: "uuid", nullable: false),
                    ReviewerDeveloperId = table.Column<Guid>(type: "uuid", nullable: false),
                    Comment = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
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
                    table.PrimaryKey("PK_ProjectProgressReviews", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProjectProgressEntries_ProjectId_CreationTime",
                table: "ProjectProgressEntries",
                columns: new[] { "ProjectId", "CreationTime" });

            migrationBuilder.CreateIndex(
                name: "IX_ProjectProgressEntries_TenantId_DeveloperId_ProjectId",
                table: "ProjectProgressEntries",
                columns: new[] { "TenantId", "DeveloperId", "ProjectId" });

            migrationBuilder.CreateIndex(
                name: "IX_ProjectProgressReviews_EntryId_ReviewerDeveloperId",
                table: "ProjectProgressReviews",
                columns: new[] { "EntryId", "ReviewerDeveloperId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProjectProgressReviews_TenantId_ReviewerDeveloperId",
                table: "ProjectProgressReviews",
                columns: new[] { "TenantId", "ReviewerDeveloperId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ProjectProgressEntries");

            migrationBuilder.DropTable(
                name: "ProjectProgressReviews");

            migrationBuilder.DropColumn(
                name: "IsMentor",
                table: "ProjectMembers");
        }
    }
}
