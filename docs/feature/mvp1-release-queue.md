# MVP 1 release queue

Snapshot: 2026-10-17. Recheck GitHub issue and PR state before choosing the next task.

| Order | Issue | Why it is next | State |
| --- | --- | --- | --- |
| 1 | [#119 First-use clarity](https://github.com/lethabomaepa11/mosaic-talent/issues/119) | Simplifies the account and onboarding path before new users enter the workspace | Merged to `dev` |
| 2 | [#94 Developer onboarding](https://github.com/lethabomaepa11/mosaic-talent/issues/94) | Required account and profile flow | Merged to `dev`; fresh PostgreSQL migration and seed validation passed |
| 2 | [#102 OAuth logout](https://github.com/lethabomaepa11/mosaic-talent/issues/102) | Reliable sign out and account switching | Merged to `dev` |
| 3 | [#98 Project creation](https://github.com/lethabomaepa11/mosaic-talent/issues/98) | Lets a new developer start a project without GitHub | Merged to `dev` |
| 4 | [#97 Open project browser](https://github.com/lethabomaepa11/mosaic-talent/issues/97) | Lets new users find a team | Merged to `dev` |
| 5 | [#96 AI match comparison](https://github.com/lethabomaepa11/mosaic-talent/issues/96) and [#95 My Projects](https://github.com/lethabomaepa11/mosaic-talent/issues/95) | Improves first project selection and return visits | Merged to `dev` |
| 6 | [#99 Early peer reviews](https://github.com/lethabomaepa11/mosaic-talent/issues/99) and [#100 Work evidence](https://github.com/lethabomaepa11/mosaic-talent/issues/100) | Enables feedback during collaboration and documented contributions | Merged to `dev` |
| 7 | [#90 Developer landing](https://github.com/lethabomaepa11/mosaic-talent/issues/90) | Makes signup and developer value clear before login | [PR #113](https://github.com/lethabomaepa11/mosaic-talent/pull/113) open |
| 8 | [#121 Profile workspace tabs](https://github.com/lethabomaepa11/mosaic-talent/issues/121) | Keeps profile, project memberships, and learning guidance focused | In progress |
| 9 | [#91 Open project experience](https://github.com/lethabomaepa11/mosaic-talent/issues/91) | Improves the core discover-and-join journey after #97 | Open, no PR |
| 10 | [#93 Deprecate simulator](https://github.com/lethabomaepa11/mosaic-talent/issues/93) | Removes a feature the product owner no longer wants in v1 | Open, no PR |
| 11 | [#92 Collapsible sidebar](https://github.com/lethabomaepa11/mosaic-talent/issues/92) | Workspace usability polish | Open, no PR |

[Issue #111](https://github.com/lethabomaepa11/mosaic-talent/issues/111) tracks the shared CI test teardown defect. [PR #112](https://github.com/lethabomaepa11/mosaic-talent/pull/112) is green; its fix was also applied to the open v1 branches so their checks can rerun.
