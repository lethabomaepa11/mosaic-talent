# AI Simulator retirement

Issue #93 removes the AI Simulator from the developer journey. Navigation, quick actions, header search, and Ask Moahi no longer advertise or execute simulator workflows. Saved `/app/simulator` links redirect to Discover (`/app/projects/open`).

The backend rejects new scenario creation and new session starts with a clear retirement error. Existing scenarios, sessions, messages, feedback, earned badges, and rating inputs remain in the database. Read and completion endpoints remain available for existing records; this change requires no database migration.

The public landing page is being replaced with a developer-first version in PR #113, which also removes the simulator promotion. Merge that PR before considering the retirement complete in the public site.

Validation: frontend unit tests cover navigation, planner capabilities, and header search; backend tests cover the two blocked write operations. Run the frontend build and .NET test suite before release.
