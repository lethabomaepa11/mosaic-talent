using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MosaicTalent.Migrations
{
    /// <inheritdoc />
    public partial class AddEmailService : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "EmailTemplateSettingsJson",
                table: "CompanyJobsPageSettings",
                type: "character varying(16000)",
                maxLength: 16000,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EmailTemplateSettingsJson",
                table: "CompanyJobsPageSettings");
        }
    }
}
