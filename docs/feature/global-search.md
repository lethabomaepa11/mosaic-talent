# Global Search

## Problem

The top bar search input previously did not query real data, so it could not help teams quickly jump to specific developers, projects, or simulations.

## Solution

- Added a backend endpoint: `GET /api/services/app/DeveloperOnboarding/SearchPublicDevelopers` that accepts a query string and returns lightweight developer profiles with display name, avatar, GitHub username, and skill tags.
- The developer provider now exposes `searchPublicDevelopers(query)` so client code can reuse the endpoint.
- Updated `AppHeader` to render an `AutoComplete` that:
  - Debounces user input and fetches developer suggestions.
  - Filters open/my projects and simulation scenarios locally.
  - Groups options under “Developers”, “Projects”, and “Simulations”.
  - Navigates to `/developers/[username]`, `/app/projects/[id]`, or `/app/simulator?scenarioId={id}` when a suggestion is chosen.
- The simulator page reads `scenarioId` from the query string and pre-selects that scenario when the page loads.

## Testing

- `npm test`
- `npm run lint`
- `dotnet build src/MosaicTalent.Application/MosaicTalent.Application.csproj`
