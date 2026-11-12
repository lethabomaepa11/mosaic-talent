# Human support through tawk.to

Tracking: [#141](https://github.com/lethabomaepa11/mosaic-talent/issues/141). The owner approved free tawk.to instead of a custom dashboard on 2026-11-12 and supplied the public widget URL.

## User flow

One shared `?` button, labelled Support for assistive technology, appears across public, authentication, developer and company routes. It opens a small support panel with Contact support and the getting started guide. Help uses the same actions and plain copy. All previous Ask Moahi mounts and the obsolete panel component are removed; the legacy operator backend/provider modules remain without an active UI.

Contact support loads tawk.to on demand, then opens its human support widget. The widget can collect a visitor's email and message. Requests go to the configured property's inbox. Minimize hides the vendor launcher so the application retains its single question-mark entry point. There is no automatic AI answer, command execution, or local ticket store.

The existing provider architecture owns all SDK calls. A single readiness promise prevents duplicate scripts across navigation and simultaneous requests. Script errors, incomplete vendor initialization and a 15-second readiness timeout produce an actionable error and allow another attempt. Missing or invalid explicit configuration preserves the guide and reports that messaging is unavailable. Opening the widget never claims that a ticket was sent; delivery happens in tawk.to.

## Configure this site or add another

- Default mosaic.talent embed: `https://embed.tawk.to/6af5d41ae84c933e6cc134c5/1k7849236`. This is the owner-supplied public identifier, not a private API credential.
- Optional `NEXT_PUBLIC_TAWK_EMBED_URL` selects another property's embed URL. Only `https://embed.tawk.to/<24-character-property-id>/<widget-id>` is accepted. An explicitly empty value disables messaging. Next inlines this variable at build time; rebuild/redeploy after changing it.
- In [tawk.to](https://dashboard.tawk.to), create one property per website with its name and URL. Copy its embed URL from Administration → Chat Widget. Install the corresponding identifier in that site's integration. The property, not the user-entered subject, identifies which website a request comes from.
- Under Administration → Chat Widget, configure the pre-chat/offline forms to collect email and a useful message. Leave AI Assist and proactive greeting triggers off for this human support flow. Check widget domain restrictions against production and any intended preview domain.
- Under Administration → Settings → Mail Notifications, enable offline form and new-ticket notifications for the owner's inbox. New chat, offline message and ticket notifications are separate settings; new-ticket alerts alone do not cover every widget conversation.
- Use the property's Inbox to respond and manage tickets. Offline messages may need conversion to tickets for follow-up; this integration does not promise that every chat is automatically a ticket.

Official references: [multiple properties](https://help.tawk.to/article/adding-additional-websites-to-the-dashboard), [mail notifications](https://help.tawk.to/article/adjusting-mail-notifications), [ticketing](https://help.tawk.to/article/how-to-set-up-ticketing-in-tawkto), [JavaScript API](https://developer.tawk.to/jsapi/).

## Data and deployment

The app does not copy account names, emails, tokens, project contents or auth state into SDK attributes. Visitors enter contact details in the vendor's form. Once loaded, tawk.to manages the support conversation, cookies and page context under its own policies; incorporate that service into the site's privacy disclosures. Do not enter passwords or access tokens in support messages. No Neon database, new backend schema, paid pre-deploy hook, or migration command is needed.

The Support provider and launcher are shared once under the global application providers. The launcher sits above the mobile bottom navigation and respects the safe area. Existing public SEO and private noindex rules remain unchanged.

## Validation

Unit checks cover allowed URLs, lazy loading, duplicate-load prevention, readiness timeout, blocked scripts, incomplete APIs, retries, provider error/success state, guide links and accessible controls. Browser checks cover 360px, 768px and desktop layouts, all former auth mounts, keyboard opening/closing, a single launcher, navigation reuse and Help error recovery. Browser test doubles apply only to the external support SDK; live widget and email delivery need separate verification with the configured property.

Local validation passed: 277 frontend unit tests across 70 files, standalone TypeScript, the final production build, and 21 browser checks covering support, public SEO, signup, onboarding, branding, practical Home and the desktop sidebar. Targeted lint has zero errors and four pre-existing warnings in the touched layouts. The first unrestricted local unit run competed with the build and hit three 5-second timeouts; the full suite then passed with two workers. One browser assertion was scoped to main content to distinguish its alert from Next's route announcer. A regression run that overlapped rebuilding the preview was invalidated by changing build artifacts; the preview was restarted against the completed build and all 21 checks passed together.

The real owner-supplied vendor widget opened successfully in the local production build, minimized without leaving a second launcher, and reopened without loading another script. The panel was visually checked at phone and desktop widths. No message was sent during that inspection. On 2026-11-12 the owner confirmed the local flow works, authorized publication, and confirmed offline form/new-ticket email notifications are enabled. Actual email arrival was not independently tested. Publication uses a protected-main pull request; deployment completion is verified separately.

Local review on the same Wi-Fi: `http://192.168.0.238:3002/login` → `?` → Contact support. Confirm the widget opens, then minimize and reopen it. Getting started remains available from the same panel; logged-in users can also use `/app/help`. The preview binds to all local interfaces on port 3002 and uses the isolated local API. Port 3000 belongs to another project and is untouched.
