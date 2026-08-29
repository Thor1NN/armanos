# ArmanOS — Vercel + Neon Deployment

## Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `DATABASE_URL` | Vercel (all envs) + local `.env` | Neon PostgreSQL connection string. **Use a separate Neon branch/database for Preview** so preview deployments never touch production data. Use the pooled (`-pooler`) Neon connection string for the runtime. |
| `PAYLOAD_SECRET` | Vercel (all envs) + local `.env` | Long random secret for Payload auth tokens (e.g. `openssl rand -hex 32`). Different value per environment. |
| `NEXT_PUBLIC_BASE_URL` | Vercel (all envs) + local `.env` | Canonical URL of the deployment, e.g. `https://armanos.vercel.app`. Drives CORS/CSRF allow-list, invite links, and share links. |
| `PAYLOAD_CORS` (optional) | Vercel | Extra allowed origins, comma-separated (e.g. a `www.` variant). Defaults to `NEXT_PUBLIC_BASE_URL`. |

The app fails fast at boot if `PAYLOAD_SECRET` or `DATABASE_URL` is missing.

## One-time setup

1. **Neon**: create a project → copy the pooled connection string for `DATABASE_URL` (production). Create a second branch (e.g. `preview`) and use its connection string for Vercel's Preview environment.
2. **Vercel**: import the repo. Framework preset: Next.js. Node.js 24.x (`engines` requires ≥24).
   - Build command: `yarn migrate:prod && yarn build`
   - `scripts/migrate-prod.sh` runs Payload migrations **only when `VERCEL_ENV=production`** — preview builds skip migrations entirely, so previews can never migrate the production database (and, with a preview-branch `DATABASE_URL`, never even connect to it).
3. Set the environment variables above (per environment).
4. Deploy. First production deploy runs all migrations against Neon.
5. Open `https://<your-domain>/admin` and create the first user — this is the coach/super-admin account.

## Per-release checklist

1. `yarn lint && yarn typecheck` — clean.
2. `yarn build` — succeeds locally.
3. `yarn test:int` — integration tests pass (needs a local Postgres; see `tests/int/global-setup.ts`, `TEST_DATABASE_URL`).
4. If collections changed: `yarn payload migrate:create` was run and the migration is committed (never rely on `push` — it is disabled).
5. Merge/push → Vercel builds; production build runs `migrate:prod` before `next build`.
6. Smoke test: log in as coach (`/admin`), log in as a client (`/`), log one set, finish a workout, check `/history`.

## Operational notes

- **No file uploads in V1**: the `media` collection is locked (Vercel has no persistent disk). Exercise videos are URL-based (`exercises.videoUrl`). If uploads are ever needed, add `@payloadcms/storage-vercel-blob` first.
- **Client onboarding**: create the Client in `/admin`, then use **Generate invite / reset link** on the client document and send the URL to the client (valid 1 hour). They set their own password at `/set-password`.
- **Archiving**: set a client's `status` to `Archived` to block their login while preserving history. Deleting anything referenced by logs (client, plan, workout, exercise…) is blocked server-side.
- **Timestamps** are stored in UTC (`timestamptz`); weights are stored in kg (0.25 steps).
- **PWA**: clients can install the app from the browser menu ("Add to Home Screen"). The service worker only caches static assets and never API responses.
