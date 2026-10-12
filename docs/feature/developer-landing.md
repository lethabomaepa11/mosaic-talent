# Developer landing page

The public root page introduces Mosaic Talent through the first developer journey: create an account, add skills and goals, join a team project, record contributions, and receive feedback. Its primary actions link directly to `/signup`, while returning members can sign in through `/login`. GitHub is presented as an optional onboarding step.

The page removes company hiring copy, the simulator promotion, and unverified usage and compliance claims. Company routes remain available for existing company users. Tenant subdomains still redirect from the public root page to the workspace.

The layout uses the route's `createStyles` file and keeps the main signup action visible at 360px, tablet, and desktop widths. Playwright covers the signup link and horizontal overflow at those widths.
