# Project creation with optional GitHub

Issue [#98](https://github.com/lethabomaepa11/mosaic-talent/issues/98) asks for project creation from an existing repository, creation of a new repository, or no repository.

GitHub is optional for project creation. When connected, the form starts with no repository selected; choosing a repository fills the project title from its name while leaving the description empty. A user-edited title remains intact when changing repositories. The existing README action is available for explicitly filling the description. Creating a new GitHub repository selects it and applies the same title behavior.

When a repository is selected, the backend still verifies ownership and requires a passing safety scan before saving it to the project. With no repository, the project is created with a null repository and no GitHub API or safety scan is required. The existing nullable database column supports this behavior, so no migration is needed.
