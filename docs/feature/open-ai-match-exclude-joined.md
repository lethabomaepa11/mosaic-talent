# Exclude Joined Projects From Open List And AI Match

## Summary

Developers are no longer matched to projects they already belong to.

## Behavior Changes

- `GetOpenProjects` now excludes projects where current developer is already a member.
- Open/Discover UI inherits this behavior through the same endpoint.
- `AiMatchProject` uses `GetOpenProjects`, so AI matching now also excludes already-joined projects.

## Implementation

- `aspnet-core/src/MosaicTalent.Application/Services/DeveloperProjectService/DeveloperProjectAppService.cs`
  - updated `GetOpenProjects` query to filter out current member project IDs.
