using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MosaicTalent.Migrations
{
    /// <inheritdoc />
    public partial class IdeatorAndPrivateProjectWorkspace : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsPublic",
                table: "Projects",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<string>(
                name: "ProblemStatement",
                table: "Projects",
                type: "character varying(4000)",
                maxLength: 4000,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "IdeaComments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<int>(type: "integer", nullable: false),
                    IdeaPostId = table.Column<Guid>(type: "uuid", nullable: false),
                    AuthorDeveloperId = table.Column<Guid>(type: "uuid", nullable: false),
                    Body = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
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
                    table.PrimaryKey("PK_IdeaComments", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "IdeaPosts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<int>(type: "integer", nullable: false),
                    CreatorDeveloperId = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    ProblemStatement = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: false),
                    ProposedSolution = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: false),
                    IsArchived = table.Column<bool>(type: "boolean", nullable: false),
                    IsPublic = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    ConvertedProjectId = table.Column<Guid>(type: "uuid", nullable: true),
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
                    table.PrimaryKey("PK_IdeaPosts", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "IdeaReactions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<int>(type: "integer", nullable: false),
                    IdeaPostId = table.Column<Guid>(type: "uuid", nullable: false),
                    DeveloperId = table.Column<Guid>(type: "uuid", nullable: false),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    CreationTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IdeaReactions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ProjectResources",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<int>(type: "integer", nullable: false),
                    ProjectId = table.Column<Guid>(type: "uuid", nullable: false),
                    AddedByDeveloperId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    Description = table.Column<string>(type: "character varying(1200)", maxLength: 1200, nullable: true),
                    Url = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: false),
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
                    table.PrimaryKey("PK_ProjectResources", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ProjectWikiPages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<int>(type: "integer", nullable: false),
                    ProjectId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedByDeveloperId = table.Column<Guid>(type: "uuid", nullable: false),
                    UpdatedByDeveloperId = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    ContentMarkdown = table.Column<string>(type: "character varying(20000)", maxLength: 20000, nullable: true),
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
                    table.PrimaryKey("PK_ProjectWikiPages", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_IdeaComments_TenantId_IdeaPostId_CreationTime",
                table: "IdeaComments",
                columns: new[] { "TenantId", "IdeaPostId", "CreationTime" });

            migrationBuilder.CreateIndex(
                name: "IX_IdeaPosts_ConvertedProjectId",
                table: "IdeaPosts",
                column: "ConvertedProjectId");

            migrationBuilder.CreateIndex(
                name: "IX_IdeaPosts_TenantId_IsArchived_CreationTime",
                table: "IdeaPosts",
                columns: new[] { "TenantId", "IsArchived", "CreationTime" });

            migrationBuilder.CreateIndex(
                name: "IX_IdeaReactions_IdeaPostId_DeveloperId",
                table: "IdeaReactions",
                columns: new[] { "IdeaPostId", "DeveloperId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_IdeaReactions_TenantId_IdeaPostId_Type",
                table: "IdeaReactions",
                columns: new[] { "TenantId", "IdeaPostId", "Type" });

            migrationBuilder.CreateIndex(
                name: "IX_ProjectResources_TenantId_ProjectId_Name",
                table: "ProjectResources",
                columns: new[] { "TenantId", "ProjectId", "Name" });

            migrationBuilder.CreateIndex(
                name: "IX_ProjectWikiPages_TenantId_ProjectId_Title",
                table: "ProjectWikiPages",
                columns: new[] { "TenantId", "ProjectId", "Title" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "IdeaComments");

            migrationBuilder.DropTable(
                name: "IdeaPosts");

            migrationBuilder.DropTable(
                name: "IdeaReactions");

            migrationBuilder.DropTable(
                name: "ProjectResources");

            migrationBuilder.DropTable(
                name: "ProjectWikiPages");

            migrationBuilder.DropColumn(
                name: "IsPublic",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "ProblemStatement",
                table: "Projects");
        }
    }
}
