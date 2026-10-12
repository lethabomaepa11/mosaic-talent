using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MosaicTalent.Migrations
{
    /// <inheritdoc />
    public partial class DeveloperOnboardingV1 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "GithubUsername",
                table: "Developers",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(64)",
                oldMaxLength: 64);

            migrationBuilder.Sql(
                "UPDATE \"Developers\" SET \"GithubUsername\" = NULL WHERE btrim(\"GithubUsername\") = '';");
            migrationBuilder.Sql(@"
DO $$
BEGIN
    IF EXISTS (
        SELECT lower(btrim(""GithubUsername""))
        FROM ""Developers""
        WHERE ""IsDeleted"" = false AND ""GithubUsername"" IS NOT NULL
        GROUP BY lower(btrim(""GithubUsername""))
        HAVING count(*) > 1
    ) THEN
        RAISE EXCEPTION 'Resolve duplicate active GitHub identities case-insensitively before applying onboarding migration.';
    END IF;
END $$;");

            migrationBuilder.AddColumn<bool>(
                name: "HasCompletedOnboarding",
                table: "DeveloperProfiles",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "OnboardingStep",
                table: "DeveloperProfiles",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Developers_GithubUsername",
                table: "Developers",
                column: "GithubUsername",
                unique: true,
                filter: "\"GithubUsername\" IS NOT NULL AND \"IsDeleted\" = false");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Developers_GithubUsername",
                table: "Developers");

            migrationBuilder.DropColumn(
                name: "HasCompletedOnboarding",
                table: "DeveloperProfiles");

            migrationBuilder.DropColumn(
                name: "OnboardingStep",
                table: "DeveloperProfiles");

            migrationBuilder.AlterColumn<string>(
                name: "GithubUsername",
                table: "Developers",
                type: "character varying(64)",
                maxLength: 64,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "character varying(64)",
                oldMaxLength: 64,
                oldNullable: true);
        }
    }
}
