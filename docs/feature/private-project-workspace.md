# Private project workspace (#130)

Project creation now requires a clear problem statement and starts private. The creator can opt into Discover with an explicit checkbox. Public project listings and public developer profiles exclude private projects, and direct project access checks ownership, membership, and pending invitations. Existing projects retain public visibility when the schema change is applied.

Project type and initial status remain system defaults instead of user-facing choices. Team size is optional; an unset limit allows teammates to join without an artificial cap. The project detail Tasks tab is the shared work board. Members can use the Wiki & resources tab to add Markdown notes and share HTTP(S) links. Only signed-in project members can read or change this workspace.

Project discovery and project details lead with the problem statement so learners can judge the real problem before reading implementation details. Open projects use a flat feed layout instead of stacked card panels, and AI matches repeat the problem alongside the match explanation. Project search includes problem-statement text. Members can see whether their workspace is private or listed in Discover.

The creation form keeps the problem statement distinct from the project overview and solution. Repository linking remains optional, so a private school or group project can be created without publishing it to Discover or linking a GitHub repository.

## Storage and rollout

The backend adds `Project.ProblemStatement`, `Project.IsPublic`, optional team capacity, and the `ProjectWikiPage` and `ProjectResource` tables. EF Core model defaults preserve existing project visibility and provide an empty problem statement for existing rows. The agent did not generate or apply a database migration, per repository instructions. A migration must be generated and validated manually before deploying this feature.
