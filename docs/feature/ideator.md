# Ideator (#129)

Ideator gives signed-in developers a place to discuss an idea before forming a project. Each post requires a title, problem statement, and proposed solution, and the author can keep the idea private or share it publicly. Private ideas are visible only to their author. Public posts accept one reaction per developer: Interested signals willingness to hear about a team, Like supports the idea, and Dislike signals concern. Reactions can be changed or removed. Comments are intended for constructive suggestions.

Only the post creator can remove their idea or convert it. Conversion creates a private group project whose description contains both the problem and proposed solution. If the creator chooses to invite interested people, the backend creates pending project invitations; it never adds those developers as members. Project invitations retain their existing accept/reject flow. Private projects are excluded from open-project discovery and public developer profiles.

The authenticated route is `/app/ideator`, available in the developer sidebar and the mobile More menu. On mobile, the fixed primary navigation remains Discover, Reviews, Profile, and More. The feed and composer use the route's responsive `createStyles` file and keep form fields labelled with plain-language placeholders.

## Storage and rollout

The backend adds `IdeaPost`, `IdeaReaction`, and `IdeaComment`, with a uniqueness constraint allowing one reaction per developer per idea. It also adds `Project.IsPublic`, defaulting existing projects to public when the schema migration is applied. These fields and indexes are registered in the EF Core model. A database migration has **not** been generated or applied, and this feature is not deployable until the project owner runs and validates the migration under the repository's migration policy. No database migration command was run by the agent.

Issue #130 adds required problem statements, explicit project visibility, and member-only wiki and shared links. Projects already use a task board; this issue keeps it as the project board and removes unnecessary project type, starting status, and team cap fields from the creation flow.

## Release queue snapshot (2026-10-21)

| Order | Issue | Rationale | State |
| --- | --- | --- | --- |
| 1 | [#127 Developer how-to guide](https://github.com/lethabomaepa11/mosaic-talent/issues/127) | The implementation merged via [PR #128](https://github.com/lethabomaepa11/mosaic-talent/pull/128). | Merged; issue closed |
| 2 | [#129 Ideator](https://github.com/lethabomaepa11/mosaic-talent/issues/129) | The user explicitly described idea discovery as the first idea-factory capability; conversion uses pending invitations. | [Draft PR #132](https://github.com/lethabomaepa11/mosaic-talent/pull/132); CI passed; migration pending |
| 3 | [#130 Private project workspace](https://github.com/lethabomaepa11/mosaic-talent/issues/130) | Adds explicit privacy, required problem statements, and a shared workspace on top of #129. | [Draft PR #134](https://github.com/lethabomaepa11/mosaic-talent/pull/134), stacked on #132; migration pending |
| 4 | [#133 Swagger upload schema](https://github.com/lethabomaepa11/mosaic-talent/issues/133) | Confirmed Swagger JSON failed while generating the existing file upload action; this blocked API documentation consumers, but not browser onboarding. | [PR #135](https://github.com/lethabomaepa11/mosaic-talent/pull/135); local validation and CI passed |

There are no open labels, assignees, or milestones on these issues as of this snapshot. #127 was closed after its merged implementation was verified. The serial frontend E2E suite passed 23/23 before the project creation requirements changed; #130 updates and reruns the affected project creation coverage.
