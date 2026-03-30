# Notifications, PWA, Mobile, and Desktop

## Summary

This feature extends the existing notification implementation to cover:

- In-app notification center with unread counters and mark-as-read actions.
- Browser push notifications backed by VAPID subscriptions.
- PWA conversion for installability and service worker push handling.
- Mobile wrapper scaffolding using Capacitor.
- Desktop wrapper scaffolding using Electron.

## Backend behavior

The backend notification channel supports:

- Fetching a paginated feed from ABP notification tables.
- Marking single/all notifications as read.
- Upserting and removing active push subscriptions per tenant + user + endpoint.
- Sending web push on project join notifications when VAPID is configured.

Current VAPID config keys:

- `WebPush__PublicKey`
- `WebPush__PrivateKey`
- `WebPush__Subject`

`WebPush` NuGet package is pinned to `1.0.12` because that is the latest available version on NuGet as of March 30, 2026.

## Frontend behavior

### Notification center

- Added a reusable notification drawer component used by both developer and company headers.
- Supports:
  - unread badge count
  - list display with severity + time
  - mark single notification read
  - mark all notifications read
  - push subscribe/unsubscribe actions
  - install-app action (when browser provides install event)

### Push lifecycle

- Browser push initialization occurs after authenticated session state.
- Service worker registration is handled in the notification provider (`/sw.js`).
- Provider now surfaces API failures with user-friendly error messages.

## PWA implementation

Added:

- `frontend/src/app/manifest.ts`
- `frontend/public/sw.js`
- service worker security/cache headers in `frontend/next.config.ts`
- HTTPS dev script: `npm run pwa:dev`

## Mobile scaffold (Capacitor)

Added:

- `frontend/capacitor.config.json`
- scripts:
  - `npm run mobile:sync`
  - `npm run mobile:open:android`
  - `npm run mobile:open:ios`

Recommended package install before first use:

- `npm i -D @capacitor/cli @capacitor/core @capacitor/android @capacitor/ios`

Notes:

- Current config points at hosted web app URL for wrapper mode.
- Native push in mobile wrappers requires APNs/FCM device-token channel (separate from web VAPID subscriptions).

## Desktop scaffold (Electron)

Added:

- `frontend/desktop/main.cjs`
- `frontend/desktop/preload.cjs`
- script: `npm run desktop:start`

Recommended package install before first use:

- `npm i -D electron`

`main.cjs` opens Mosaic Talent in a hardened BrowserWindow and routes external links to the system browser.

## Migration note

If your local database does not yet have the `PushSubscription` table/indexes, run migrations manually in your normal workflow. Migration commands were intentionally not executed by the agent.
