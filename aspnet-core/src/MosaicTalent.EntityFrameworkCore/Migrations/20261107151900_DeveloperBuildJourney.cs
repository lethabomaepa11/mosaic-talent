using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MosaicTalent.Migrations
{
    /// <inheritdoc />
    public partial class DeveloperBuildJourney : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AcceptanceCriteria",
                table: "ProjectTasks",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsStarterTask",
                table: "ProjectTasks",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "FirstOutcome",
                table: "Projects",
                type: "character varying(800)",
                maxLength: 800,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Purpose",
                table: "Projects",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "TeamTimeZone",
                table: "Projects",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CollaborationIntent",
                table: "DeveloperProfiles",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "TimeZone",
                table: "DeveloperProfiles",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "WeeklyHours",
                table: "DeveloperProfiles",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AcceptanceCriteria",
                table: "ProjectTasks");

            migrationBuilder.DropColumn(
                name: "IsStarterTask",
                table: "ProjectTasks");

            migrationBuilder.DropColumn(
                name: "FirstOutcome",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "Purpose",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "TeamTimeZone",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "CollaborationIntent",
                table: "DeveloperProfiles");

            migrationBuilder.DropColumn(
                name: "TimeZone",
                table: "DeveloperProfiles");

            migrationBuilder.DropColumn(
                name: "WeeklyHours",
                table: "DeveloperProfiles");
        }
    }
}
