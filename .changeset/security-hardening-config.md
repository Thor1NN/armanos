---
'training-app': minor
---

Harden security configuration (no DB migration required):

- Explicit `auth` config on `users` and `clients` (2h token expiration, 5 max login attempts, 10 min lockout, `secure` cookies in production, `sameSite: Lax`)
- Add `serverURL`, CORS and CSRF whitelists scoped to `NEXT_PUBLIC_BASE_URL`
- Disable the unused GraphQL API and remove its routes to shrink the public API surface
- Restrict Media uploads to images and cap file size at 5 MB
