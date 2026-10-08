using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MosaicTalent.Migrations
{
    /// <inheritdoc />
    public partial class AddDeveloperGithubTokenColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "GithubAccessTokenEncrypted",
                table: "Developers",
                type: "character varying(4096)",
                maxLength: 4096,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "GithubAccessTokenUpdatedAt",
                table: "Developers",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "GithubAccessTokenEncrypted",
                table: "Developers");

            migrationBuilder.DropColumn(
                name: "GithubAccessTokenUpdatedAt",
                table: "Developers");
        }
    }
}
