# ArmanOS — Gap Analysis (2026-08-29)

Baseline: `codee-sh/payload-training-app` v1.4.0 (Payload 3.85.1, Next 16.2.9, Postgres).
The unchanged project builds cleanly and all 11 migrations apply. This document maps the
MVP requirements against what exists and defines the implementation scope.

## What already exists (keep as-is)

- Payload CMS architecture with strict plan/log separation (Plan → Microcycle → Workout →
  WorkoutGroup → WorkoutExerciseRow vs WorkoutLog → SetLog/ExerciseLog/RoundLog).
- Auth: `users` (coach, admin panel) and `clients` (athletes, frontend) with hardened
  client auth (2h sessions, lockout after 5 attempts).
- Server-side ownership on log writes: `beforeChange` forces `client = req.user.id`;
  `set-logs`/`exercise-logs` verify session ownership in `beforeValidate`.
- Delete protection on `workouts`, `workout-groups`, `workout-exercise-rows` when logs exist.
- Migrations-only schema (`push: false`), GraphQL disabled, CORS/CSRF restricted,
  security headers, fail-fast env validation.
- Client tracker UI: plan browser, set logging (add/edit/delete/duplicate-last),
  per-exercise notes, session times, share links.
- Coach admin: Structure tab editor, navigation fields, share-link UI, seed scripts.

## Gaps → implementation scope

### Data accuracy (non-negotiable)

| # | Gap | Action |
|---|-----|--------|
| D1 | No unique constraint on `set_logs (session, exercise_row, set_number)` — retries create duplicate sets | Migration adding unique indexes on `set_logs (session_id, exercise_row_id, set_number)`, `exercise_logs (session_id, exercise_row_id)`, `round_logs (session_id, group_id, round_number)` |
| D2 | Set create is not idempotent (client computes setNumber, plain POST) | Server-side upsert endpoint for set logs keyed by (session, exerciseRow, setNumber); unique index backstops races |
| D3 | Zero server-side numeric validation on `set-logs` | Validate: reps non-negative integers, RIR 0–10, weight ≥ 0 with 0.25 kg step, durations/distances ≥ 0; mirrored in UI inputs |
| D4 | No completion model: `finishedAt` set via free-form PATCH; session query ignores it, so a workout can never be repeated | Atomic, idempotent finish endpoint (sets `completedAt`/`finishedAt` once); tracker resumes only unfinished sessions; finished ones become history |
| D5 | `round-logs` create lacks session-ownership check; `workout-logs` create doesn't verify the workout belongs to the caller's plan | Add the same ownership verification hooks |
| D6 | Any authenticated client can read every client's plan structure (`microcycles`, `workouts`, `workout-groups`, `workout-exercise-rows` are `isAuthenticated`) | Scope reads to own plan for clients (admins unrestricted) |
| D7 | Deleting a `plan`/`microcycle`/`exercise`/`client` orphans children via `ON DELETE SET NULL`, bypassing log protection | `beforeDelete` guards on plans, microcycles, exercises, clients when referenced by logs; archive instead |
| D8 | Share token grants read of ALL of a client's logs, not just the shared plan | Documented limitation for V1 (sharing is coach-initiated and optional); cookie gets `secure` + expiry |

### Coach experience

| # | Gap | Action |
|---|-----|--------|
| C1 | Client list shows only name/email; no status, no last workout | `status` (active/archived) field + `lastWorkoutAt` maintained by workout-log hook; list columns |
| C2 | No client archiving | `status: archived` blocks client login; delete blocked when logs exist |
| C3 | No invite flow (no email service) | Admin "invite link" (Payload reset-password token, no email dependency) + frontend set-password page |
| C4 | No program duplication between clients | "Duplicate plan" endpoint + admin button: deep-copies plan → rows to a target client (templates = plans kept on any client and duplicated) |
| C5 | No progress charts | Simple per-exercise progress view (top-set weight / volume over sessions), dependency-free SVG |
| C6 | No CSV export | Admin-only endpoint exporting one client's full workout history as CSV |

### Client experience

| # | Gap | Action |
|---|-----|--------|
| E1 | No autosave; explicit save buttons only; no Saving/Saved/Failed indicator | Debounced autosave through the upsert endpoint with visible status |
| E2 | No rest timer | Countdown timer seeded from the prescribed rest, started after logging a set |
| E3 | No previous-session results next to targets | Tracker loads last finished session's sets per exercise row |
| E4 | No finish-workout flow | Finish button + confirmation dialog + idempotent completion (D4) |
| E5 | Refresh restores session but also reopens *finished* sessions | Resume filter: only sessions without `completedAt` (D4) |
| E6 | No history or progress pages | `/history` (finished sessions with sets) and `/progress` (per-exercise chart) |
| E7 | Not an installable PWA (stub manifest, no service worker, no viewport meta) | Real manifest (ArmanOS, standalone, 512px + maskable icons), minimal service worker, viewport/theme meta |
| E8 | Default locale is Polish; Polish hardcoded in tracker components; English metric labels leak into Polish UI | Default locale → `en`; move hardcoded strings into messages |

### Deployment

| # | Gap | Action |
|---|-----|--------|
| V1 | Media uploads write to local disk — breaks on Vercel | V1 has no uploads: disable media create, keep URL-based exercise media |
| V2 | No production migration story; preview deploys could migrate prod | `scripts/migrate-prod.sh` guarded by `VERCEL_ENV=production`; docs for Neon setup |
| V3 | No deployment docs | `docs/DEPLOYMENT.md`: env vars (PAYLOAD_SECRET, DATABASE_URL, NEXT_PUBLIC_BASE_URL), checklist |
| V4 | Branding | App name → ArmanOS (metadata, manifest, admin meta) |

### Quality

| # | Gap | Action |
|---|-----|--------|
| Q1 | Zero tests | Vitest integration tests against Postgres: authorization, set upsert/dedup, validation/unit handling, workout completion idempotency, historical-log preservation |
| Q2 | CI doesn't build/lint/test | Out of MVP scope (release tooling preserved); local commands documented |

## Explicitly out of scope (per requirements)

Payments, multi-gym, social, AI coaching, nutrition, messaging, native apps, email
sending, media uploads, role granularity beyond coach/client.
