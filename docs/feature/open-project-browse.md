# Open project browsing

The Discover page now opens with a clear choice between a filterable full project list and a one-at-a-time swipe flow. It shows the number of currently open projects and explains the two ways to explore before the developer acts. The page no longer repeats a Go to My Projects link; personal project review lives in the Profile workspace tabs.

The Discover page now opens in a full project list. Developers can search project names, descriptions, skills, and technologies, filter by one or more skills and difficulty, and sort by newest, oldest, title, or weekly hours. The existing swipe experience remains available as a view mode.

Both views use the existing open-project API and join workflow, including the current workload warning before a developer joins. Filters run against the fetched open projects, so no backend changes or migration are required.

Validation covers search and difficulty filtering in the browser suite. The responsive filter layout uses one column on small phones, two columns on tablet-sized screens, and a wider grid on desktop.

Related issue: [#97](https://github.com/lethabomaepa11/mosaic-talent/issues/97).
