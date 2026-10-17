# Profile workspace tabs

The developer profile is divided into focused tabs so people can work with one concern at a time:

- **Profile** keeps editable personal details, GitHub details, and profile statistics.
- **Skills** and **Learning Goals** each have a focused editing tab, including AI suggestions and a clear save action.
- **My Projects** loads the authenticated developer's provider-backed project memberships and separates active work from completed work. Each project opens its delivery workspace; users can also browse projects or start a new one.
- **Learning Path** keeps progression, badges, and AI recommendations together.

The existing `/app/projects/my` route remains available for its detailed filtering and sorting controls. The developer sidebar and Open Projects header no longer duplicate a My Projects link; use the Profile tab for the personal-project summary. The profile tab intentionally uses a simple responsive list instead of project cards, which keeps the summary view easy to scan on phones.
