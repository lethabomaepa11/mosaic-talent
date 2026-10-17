# First-use clarity

Issue [#119](https://github.com/lethabomaepa11/mosaic-talent/issues/119) makes the account and onboarding journey easier to understand on a phone or desktop.

Developer login, signup, onboarding, and company signup now use direct page layouts rather than centered card containers. Labels remain visible, and every editable field in these forms gives a concrete example through its placeholder.

The developer login and signup pages include an appearance switch before authentication. It uses the existing appearance provider and only saves the visual preference; authentication remains handled by the real auth provider and backend endpoints.

Moahi is available during login, signup, company signup, and onboarding. Natural-language questions remain the main interaction. Simple shortcuts work without an AI service or account:

- `/help` explains what Moahi can do.
- `/login`, `/signup`, `/onboarding`, and `/company` open the relevant first-use route.

The affected layouts stack cleanly on small screens and expand without horizontal overflow at tablet and desktop widths.
