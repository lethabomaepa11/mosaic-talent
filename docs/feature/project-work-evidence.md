# Project work evidence

Project members can record a contribution with a title, summary, link to a pull request or other artifact, and a self-reflection. Entries are visible to other members of that project. Teammates can leave or update constructive feedback on another member's entry; an author cannot review their own entry.

Project leads can optionally mark members as mentors. Mentor status is limited to an existing project member and is managed by a project lead. Feedback records identify the reviewer as a teammate or mentor. Progress summaries and self-reflections are included when AI creates peer-review questions after project completion; evidence links are not sent to the AI provider.

Entries can be added while a project is open or in progress. The backend validates required text and accepts evidence links only over HTTP or HTTPS. The feature uses the existing tenant-scoped project membership checks and requires the `DocumentProjectWorkEvidence` database migration before deployment.
