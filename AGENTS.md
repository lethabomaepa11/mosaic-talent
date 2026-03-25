<!-- BEGIN:nextjs-agent-rules -->
# Always follow skills provided

Always follow the skills provided in the `.agents/skills` folder.

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `/frontend/node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

# Authentication and Data Rules (Production Mode)

- Do not use mock data, demo login shortcuts, or simulated auth delays for application auth flows.
- Do not use `localStorage` to persist authenticated user/session state.
- Authentication must be wired to real backend endpoints through provider actions (for example, the auth provider), not component-level mock logic.
- UI pages/components should call provider actions/hooks; API calls must remain in providers.

# Frontend Responsiveness Rules

- Every frontend feature/page must be mobile responsive by default (target 360px+ small phones, 768px tablets, and desktop).
- In route pages, keep responsive behavior in `app/<route>/style.ts` (or route-group equivalent) using `createStyles`; do not rely on inline styles.
- Use breakpoint-aware spacing/typography/layout (stack on mobile, expand to multi-column on tablet/desktop).
- Ensure primary actions remain visible and usable on mobile without horizontal scrolling.
- Validate responsiveness before handoff (at minimum: narrow mobile width and desktop width).
<!-- END:nextjs-agent-rules -->
