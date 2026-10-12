using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MosaicTalent.Migrations
{
    /// <inheritdoc />
    public partial class AllowRepeatedPeerReviewRequests : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_PeerReviews_ProjectId_ReviewerDeveloperId_RevieweeDeveloper~",
                table: "PeerReviews");

            migrationBuilder.AddColumn<bool>(
                name: "IsEarlyRequest",
                table: "PeerReviews",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "IX_PeerReviews_ProjectId_ReviewerDeveloperId_RevieweeDeveloper~",
                table: "PeerReviews",
                columns: new[] { "ProjectId", "ReviewerDeveloperId", "RevieweeDeveloperId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_PeerReviews_ProjectId_ReviewerDeveloperId_RevieweeDeveloper~",
                table: "PeerReviews");

            migrationBuilder.DropColumn(
                name: "IsEarlyRequest",
                table: "PeerReviews");

            migrationBuilder.CreateIndex(
                name: "IX_PeerReviews_ProjectId_ReviewerDeveloperId_RevieweeDeveloper~",
                table: "PeerReviews",
                columns: new[] { "ProjectId", "ReviewerDeveloperId", "RevieweeDeveloperId" },
                unique: true);
        }
    }
}
