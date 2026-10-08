using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MosaicTalent.Migrations
{
    /// <inheritdoc />
    public partial class AddAISimulation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AssessorDimensionScores",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<int>(type: "integer", nullable: false),
                    ObservationId = table.Column<Guid>(type: "uuid", nullable: false),
                    Dimension = table.Column<int>(type: "integer", nullable: false),
                    Score = table.Column<double>(type: "double precision", nullable: false),
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
                    table.PrimaryKey("PK_AssessorDimensionScores", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AssessorObservations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<int>(type: "integer", nullable: false),
                    SessionId = table.Column<Guid>(type: "uuid", nullable: false),
                    TurnIndex = table.Column<int>(type: "integer", nullable: false),
                    ObservationText = table.Column<string>(type: "character varying(3000)", maxLength: 3000, nullable: false),
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
                    table.PrimaryKey("PK_AssessorObservations", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "OrchestratorLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<int>(type: "integer", nullable: false),
                    SessionId = table.Column<Guid>(type: "uuid", nullable: false),
                    TurnIndex = table.Column<int>(type: "integer", nullable: false),
                    NextBotRole = table.Column<int>(type: "integer", nullable: false),
                    CoherenceCheckPassed = table.Column<bool>(type: "boolean", nullable: false),
                    CoherenceNotes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
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
                    table.PrimaryKey("PK_OrchestratorLogs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ScenarioMessages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<int>(type: "integer", nullable: false),
                    SessionId = table.Column<Guid>(type: "uuid", nullable: false),
                    Role = table.Column<int>(type: "integer", nullable: false),
                    Content = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: false),
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
                    table.PrimaryKey("PK_ScenarioMessages", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SimulationBots",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<int>(type: "integer", nullable: false),
                    SessionId = table.Column<Guid>(type: "uuid", nullable: false),
                    Role = table.Column<int>(type: "integer", nullable: false),
                    PersonalityPrompt = table.Column<string>(type: "character varying(3000)", maxLength: 3000, nullable: false),
                    CurrentState = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    TurnOrder = table.Column<int>(type: "integer", nullable: true),
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
                    table.PrimaryKey("PK_SimulationBots", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SimulationScenarioRequiredRoles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<int>(type: "integer", nullable: false),
                    ScenarioId = table.Column<Guid>(type: "uuid", nullable: false),
                    Role = table.Column<int>(type: "integer", nullable: false),
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
                    table.PrimaryKey("PK_SimulationScenarioRequiredRoles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SimulationScenarios",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<int>(type: "integer", nullable: false),
                    Title = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    Prompt = table.Column<string>(type: "character varying(3000)", maxLength: 3000, nullable: false),
                    BotCount = table.Column<int>(type: "integer", nullable: false),
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
                    table.PrimaryKey("PK_SimulationScenarios", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SimulationSessions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<int>(type: "integer", nullable: false),
                    ScenarioId = table.Column<Guid>(type: "uuid", nullable: false),
                    SessionType = table.Column<int>(type: "integer", nullable: false),
                    OrchestratorNeeded = table.Column<bool>(type: "boolean", nullable: false),
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
                    table.PrimaryKey("PK_SimulationSessions", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AssessorDimensionScores_ObservationId_Dimension",
                table: "AssessorDimensionScores",
                columns: new[] { "ObservationId", "Dimension" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AssessorObservations_SessionId_TurnIndex",
                table: "AssessorObservations",
                columns: new[] { "SessionId", "TurnIndex" });

            migrationBuilder.CreateIndex(
                name: "IX_AssessorObservations_TenantId_SessionId",
                table: "AssessorObservations",
                columns: new[] { "TenantId", "SessionId" });

            migrationBuilder.CreateIndex(
                name: "IX_OrchestratorLogs_SessionId_TurnIndex",
                table: "OrchestratorLogs",
                columns: new[] { "SessionId", "TurnIndex" });

            migrationBuilder.CreateIndex(
                name: "IX_OrchestratorLogs_TenantId_SessionId",
                table: "OrchestratorLogs",
                columns: new[] { "TenantId", "SessionId" });

            migrationBuilder.CreateIndex(
                name: "IX_ScenarioMessages_SessionId_CreationTime",
                table: "ScenarioMessages",
                columns: new[] { "SessionId", "CreationTime" });

            migrationBuilder.CreateIndex(
                name: "IX_ScenarioMessages_TenantId_SessionId",
                table: "ScenarioMessages",
                columns: new[] { "TenantId", "SessionId" });

            migrationBuilder.CreateIndex(
                name: "IX_SimulationBots_SessionId_Role",
                table: "SimulationBots",
                columns: new[] { "SessionId", "Role" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SimulationBots_TenantId_SessionId_TurnOrder",
                table: "SimulationBots",
                columns: new[] { "TenantId", "SessionId", "TurnOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_SimulationScenarioRequiredRoles_ScenarioId_Role",
                table: "SimulationScenarioRequiredRoles",
                columns: new[] { "ScenarioId", "Role" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SimulationScenarioRequiredRoles_TenantId_ScenarioId",
                table: "SimulationScenarioRequiredRoles",
                columns: new[] { "TenantId", "ScenarioId" });

            migrationBuilder.CreateIndex(
                name: "IX_SimulationScenarios_TenantId_Title",
                table: "SimulationScenarios",
                columns: new[] { "TenantId", "Title" });

            migrationBuilder.CreateIndex(
                name: "IX_SimulationSessions_TenantId_CreationTime",
                table: "SimulationSessions",
                columns: new[] { "TenantId", "CreationTime" });

            migrationBuilder.CreateIndex(
                name: "IX_SimulationSessions_TenantId_ScenarioId",
                table: "SimulationSessions",
                columns: new[] { "TenantId", "ScenarioId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AssessorDimensionScores");

            migrationBuilder.DropTable(
                name: "AssessorObservations");

            migrationBuilder.DropTable(
                name: "OrchestratorLogs");

            migrationBuilder.DropTable(
                name: "ScenarioMessages");

            migrationBuilder.DropTable(
                name: "SimulationBots");

            migrationBuilder.DropTable(
                name: "SimulationScenarioRequiredRoles");

            migrationBuilder.DropTable(
                name: "SimulationScenarios");

            migrationBuilder.DropTable(
                name: "SimulationSessions");
        }
    }
}
