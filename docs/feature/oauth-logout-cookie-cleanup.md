# OAuth logout cookie cleanup

Issue [#102](https://github.com/lethabomaepa11/mosaic-talent/issues/102) covers OAuth sessions that could be restored after logout. GitHub callback tokens and tenant IDs are held in HttpOnly cookies, so browser JavaScript cannot remove them.

`POST /api/TokenAuth/Logout` now expires the server OAuth token and tenant cookies, along with legacy auth cookies, using the same root path and request security settings used when issuing the OAuth session. It is safe to call without a valid access token because it only clears cookies. The frontend auth provider calls it with credentials, then clears its JavaScript token and reducer state even when the backend request fails.

The backend test verifies cookie expiry headers on an unauthenticated logout request. Auth provider tests verify the credentialed request and local cleanup on both successful and failed calls. A browser-level account-switch check remains part of release verification.
