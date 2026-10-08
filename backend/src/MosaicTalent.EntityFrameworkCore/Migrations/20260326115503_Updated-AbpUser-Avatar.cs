using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MosaicTalent.Migrations
{
    /// <inheritdoc />
    public partial class UpdatedAbpUserAvatar : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AvatarUrl",
                table: "AbpUsers",
                type: "character varying(512)",
                maxLength: 512,
                nullable: true);

            migrationBuilder.Sql(
                """
                UPDATE "AbpUsers" AS u
                SET "AvatarUrl" = d."AvatarUrl"
                FROM "Developers" AS d
                WHERE d."UserId" = u."Id"
                  AND d."AvatarUrl" IS NOT NULL
                """);

            migrationBuilder.DropColumn(
                name: "AvatarUrl",
                table: "Developers");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AvatarUrl",
                table: "Developers",
                type: "character varying(512)",
                maxLength: 512,
                nullable: true);

            migrationBuilder.Sql(
                """
                UPDATE "Developers" AS d
                SET "AvatarUrl" = u."AvatarUrl"
                FROM "AbpUsers" AS u
                WHERE d."UserId" = u."Id"
                  AND u."AvatarUrl" IS NOT NULL
                """);

            migrationBuilder.DropColumn(
                name: "AvatarUrl",
                table: "AbpUsers");
        }
    }
}
