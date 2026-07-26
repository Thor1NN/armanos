# Training App

A coach-facing admin and client-facing training tracker built with Payload CMS and Next.js. Coaches build workout plans in the admin panel; clients log their sets through a mobile-friendly web interface.

## What it does

**Coach (admin panel)** — creates plans, assigns them to clients, defines workout structure down to individual exercise rows with target sets and tracking parameters.

**Client (web app)** — logs in, sees their active plan, works through workouts session by session, and logs each set (reps, weight, RIR, time, etc.).

## Navigation

- [Data model & flow](#data-model--flow)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Project structure](#project-structure)
- [Key scripts](#key-scripts)
- [Development](#development)
- [Screenshots](#screenshots)

## Data model & flow

The data splits into two layers. The **plan layer** is the template a coach authors (read-only for clients). The **log layer** is what a client records while training. The two never mix: logging never writes to the plan, so the same template can be reused and audited.

```
PLAN LAYER (authored by coach)              LOG LAYER (recorded by client)
─────────────────────────────              ──────────────────────────────
Plan                                        WorkoutLog ............ one training session
└─ Microcycle                               ├─ SetLog ............. one logged set       (N per exercise)
   └─ Workout                               ├─ ExerciseLog ........ one note per exercise (1 per exercise)
      ├─ sections[]   "Warm-up", "Main"     └─ RoundLog ........... one round of a group  (reserved)
      └─ WorkoutGroup    → in a section
         └─ WorkoutExerciseRow              Catalog:  Exercise, Media
            └─ Exercise  (catalog, opt.)    Accounts: User (coach), Client (athlete)
                                            Sharing:  ShareLink
```

> `sections[]` is **not a collection** — it's an array of named headings (`title`/`subtitle`) stored on the `Workout`. A `WorkoutGroup` attaches to one section via its `sectionRowId`. So the visible nesting in the app is **Workout → Section → Group → Exercise row**, while in the database a group points back to its section by id.

### How a log row points back to the plan

A `WorkoutLog` references the `Workout` it belongs to and the `Client` who owns it. Each `SetLog` / `ExerciseLog` references its `session` (the `WorkoutLog`) **and** the `exerciseRow` (`WorkoutExerciseRow`) it logs against — that `exerciseRow` link is the key that ties execution back to the exact line in the plan.

```mermaid
erDiagram
    CLIENT ||--o{ PLAN : owns
    PLAN ||--o{ MICROCYCLE : has
    MICROCYCLE ||--o{ WORKOUT : has
    WORKOUT ||--o{ WORKOUT_GROUP : has
    WORKOUT_GROUP ||--o{ WORKOUT_EXERCISE_ROW : has
    EXERCISE ||--o{ WORKOUT_EXERCISE_ROW : "referenced by"

    CLIENT ||--o{ WORKOUT_LOG : logs
    WORKOUT ||--o{ WORKOUT_LOG : "session of"
    WORKOUT_LOG ||--o{ SET_LOG : has
    WORKOUT_LOG ||--o{ EXERCISE_LOG : has
    WORKOUT_LOG ||--o{ ROUND_LOG : has
    WORKOUT_EXERCISE_ROW ||--o{ SET_LOG : "logged as (N per session)"
    WORKOUT_EXERCISE_ROW ||--o{ EXERCISE_LOG : "noted as (1 per session)"
    WORKOUT_GROUP ||--o{ ROUND_LOG : "round of"

    PLAN ||--o{ SHARE_LINK : "shared via"

    PLAN {
        relationship client
        select status
    }
    WORKOUT {
        relationship microcycle
        array sections "named headings — Group.sectionRowId points here"
    }
    WORKOUT_GROUP {
        relationship workout
        text sectionRowId "which section it belongs to"
        select protocol "standard / emom / amrap / for_time / tabata"
    }
    WORKOUT_EXERCISE_ROW {
        relationship group
        relationship exercise "catalog link (optional)"
        text targets "reps, kg, rir, tut, rest…"
    }
    WORKOUT_LOG {
        relationship client
        relationship workout
    }
    SET_LOG {
        relationship session
        relationship exerciseRow
        number setNumber
    }
    EXERCISE_LOG {
        relationship session
        relationship exerciseRow
        textarea note
    }
    ROUND_LOG {
        relationship session
        relationship group
        number roundNumber "reserved — not yet written"
    }
    SHARE_LINK {
        relationship plan
        select permissions "plan / results"
        date expiresAt
    }
```

### Collections

#### Accounts

| Collection | Auth | Purpose |
|---|---|---|
| `users` | ✅ | Coaches / staff. The only accounts allowed into `/admin`. |
| `clients` | ✅ | Athletes. Log in to the client web app (never the admin). Holds `name`, a join to their `plans`, and admin-only `notes` (trainer notes, hidden from the client). 2h sessions, lockout after 5 failed logins. |

#### Catalog

| Collection | Purpose |
|---|---|
| `exercises` | Reusable exercise catalog (name, muscle group, equipment, video, description). `trackingType` decides **which metric fields** the client sees in the logging form (e.g. weight+reps vs distance+time). Readable by any authenticated user; only coaches edit. |
| `media` | Image uploads (public read). |

#### Training plan (template — coach writes, client reads)

| Collection | Belongs to | Purpose |
|---|---|---|
| `plans` | a `client` | Top-level program. Status (active/paused/completed), date range, title, description. Versioned (audit trail). Client can read only their own. |
| `microcycles` | `plan` | A block/week within the plan. Target `rpe`, `order`. |
| `workouts` | `microcycle` | A single training day. Has an `order`, optional `rpe`, and `sections[]` (named blocks like "Warm-up", "Main part"). Edited via a custom **Structure** admin tab. Cannot be deleted once it has logged sessions. |
| `workout-groups` | `workout` | A group of exercises sharing a `protocol` (Standard / EMOM / AMRAP / For Time / Tabata) and its parameters (rounds, durations, rest). Links to a workout section via `sectionRowId`. E.g. an "A1/A2 superset". Cannot be deleted if its rows have logged sets. |
| `workout-exercise-rows` | `workout-group` | One prescribed exercise line. Optional link to a catalog `exercise`, plus targets (`reps`, `kg`, `tut`, `rir`, `rest`, duration), a plan `note`, optional per-set `setParameters[]` (drop sets/pyramids), and an `override` of the group protocol. Cannot be deleted if it has logged sets. |

#### Training log (execution — client writes)

| Collection | Keyed by | Cardinality | Purpose |
|---|---|---|---|
| `workout-logs` | `client` + `workout` | one per session | A training session. Auto-titled, holds `startedAt` / `finishedAt` and general session `notes`. Creating the first set auto-creates the session. |
| `set-logs` | `session` + `exerciseRow` (+ `setNumber`) | **N per exercise** | One logged set: weight, reps, RIR, distance, duration, bodyweight flag, per-set `note`. A `beforeValidate` hook strips any metric not allowed by the exercise's `trackingType`. |
| `exercise-logs` | `session` + `exerciseRow` | **1 per exercise** | A single client note for the whole exercise in that session (vs. `set-logs`, which is per set). Same relations as `set-logs` so it can grow beyond a note later. Upserted from the tracker. |
| `round-logs` | `session` + `group` | one per round | Per-round execution of a group (round number, status, timing). **Reserved** — defined in the schema but not yet written by the app. |

For every log collection: a client may only create/read/update/delete **their own** rows (`adminOrOwnByClient`), and the owning `client` is always set server-side from the session — never trusted from the request.

#### Sharing

| Collection | Purpose |
|---|---|
| `share-links` | A tokenized, read-only link to a `plan`. `permissions` choose what is exposed (`plan` preview and/or `results` logs); `expiresAt` + `active` gate it. Only coaches manage links; the public access happens via the `share-token` cookie, which `canReadViaShareToken` validates to scope reads to that plan owner's data. |

### End-to-end flow

1. **Author** — coach creates a `Client`, then a `Plan` → `Microcycle` → `Workout`, and builds structure (`WorkoutGroup` → `WorkoutExerciseRow`) on the workout's **Structure** tab, linking each row to a catalog `Exercise`.
2. **Assign** — the plan is owned by the client; they log in and see only their own active plan.
3. **Train** — opening a workout creates a `WorkoutLog` on first save. The client logs each set as a `SetLog` (fields driven by the exercise's `trackingType`) and can attach one `ExerciseLog` note per exercise.
4. **Review** — coach reads the client's logs in the admin; deleting plan structure that already has logs is blocked to protect history.
5. **Share** (optional) — a `ShareLink` exposes a read-only plan and/or results to anyone with the link until it expires.

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| CMS / Auth | Payload CMS 3 |
| Database | PostgreSQL (`@payloadcms/db-postgres`) |
| Styling | Tailwind CSS |
| i18n | next-intl (Polish / English) |
| Forms | react-hook-form |
| Icons | lucide-react |

## Getting started

### Requirements

- Node.js ≥ 24
- Yarn 4 (`corepack enable`)
- PostgreSQL database

### Setup

```bash
git clone <repo-url>
cd training-app
yarn install
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/training_app
PAYLOAD_SECRET=your-long-random-secret-here
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

Apply existing migrations:

```bash
yarn payload migrate
```

Create a new migration only after changing the Payload schema:

```bash
yarn payload migrate:create
yarn payload migrate
```

Maintainers run migration commands manually. Agents do not generate or apply database migrations.

### Run

```bash
yarn dev
```

- App: `http://localhost:3000/pl`
- Admin panel: `http://localhost:3000/admin`

### First-time setup

1. Open `/admin` and create the first user account — this becomes the super-admin
2. (Optional) seed demo data: `yarn seed`
3. Create a **Client** record for each athlete
4. Build a **Plan**, link microcycles → workouts → exercise rows
5. The client logs in at `/pl` using their email and password set in the admin

## Project structure

```
src/
├── access/                    # Shared access control functions (isAdmin, isAuthenticated…)
├── app/
│   ├── [locale]/(frontend)/   # Client-facing app (login, workout tracker)
│   └── (payload)/             # Payload admin routes and API
├── collections/               # Payload collection configs (one folder per collection)
│   ├── clients/
│   ├── exercises/
│   ├── plans/
│   ├── microcycles/
│   ├── workouts/
│   ├── workout-groups/
│   ├── workout-exercise-rows/
│   ├── workout-logs/
│   ├── set-logs/
│   ├── exercise-logs/
│   ├── round-logs/
│   ├── share-links/
│   ├── media/
│   └── users/
├── components/
│   ├── common/                # App-wide UI (logout button…)
│   └── ui/                    # Domain-agnostic primitives (button, input, surface…)
├── data/                      # Static/seed data
├── i18n/                      # next-intl routing and request config
├── lib/                       # Domain-agnostic technical functions and SDK client
├── migrations/                # Payload database migrations
├── modules/                   # Vertical business modules
│   ├── training/
│   │   ├── exercises/         # Exercise types, constants, tracking rules, formatters
│   │   ├── plans/             # Plan types, constants, formatters, server queries
│   │   ├── logs/              # Training-log types, constants, metric transformations
│   │   ├── components/        # Training-specific frontend components and hooks
│   │   └── admin/             # Training-specific Payload Admin UI
│   └── sharing/
│       ├── server/            # Share-link validation and data loading
│       └── admin/             # Sharing-specific Payload Admin UI
├── scripts/                   # One-off CLI scripts (seed, import-plan…)
├── proxy.ts                   # Locale routing and share-token cookie handling
├── payload-types.ts           # Auto-generated — do not edit manually
└── payload.config.ts
.claude/skills/                # AI skills for Claude Code
.agents/skills/                # AI skills for Codex
.ai/specs/                     # Feature specifications
```

### Module architecture

- A module represents a business capability, not a Payload collection.
- Closely related areas stay inside one module. `training` owns `exercises`, `plans`, and
  `logs`.
- `src/app` contains routing and page composition. Feature implementations live outside it.
- Domain-specific frontend components live in `src/modules/<module>/components`.
- Server queries and use cases use an explicit `server/` entry point with `server-only`.
- Payload Admin implementations live in `src/modules/<module>/admin`.
- Payload collection configuration, access control, hooks, and relationships remain in
  `src/collections`.
- Cross-module imports use public entry points and must remain one-directional.
- `src/lib` is reserved for technical, domain-agnostic functions and SDK clients.

## Key scripts

| Script | Description |
|---|---|
| `yarn dev` | Start dev server |
| `yarn devsafe` | Clear the Next.js build cache and start the dev server |
| `yarn build` | Production build |
| `yarn start` | Start production server |
| `yarn payload migrate:create` | Generate a database migration after a schema change. Run manually. |
| `yarn payload migrate` | Run pending database migrations |
| `yarn generate:types` | Regenerate `payload-types.ts` from collection configs |
| `yarn generate:importmap` | Regenerate the Payload admin import map after adding or moving a custom admin component |
| `yarn seed` | Seed database with demo data |
| `yarn seed:export` | Export current database state to seed file |
| `yarn lint` | Run ESLint |
| `yarn format` | Format TypeScript and TSX files with Prettier |
| `yarn format:check` | Check TypeScript and TSX formatting |
| `yarn install-skills` | Install the repository's AI skills |
| `yarn changeset` | Create a release changeset |
| `npx skills add <source>` | Install AI skills into `.claude/skills/` and `.agents/skills/` |

## Development

### Adding a collection

Follow `.agents/skills/payload-build-collections` — each collection lives in
`src/collections/{kebab-case}/index.ts` and is registered in `src/collections/index.ts`.

After changing collection configs, regenerate types:

```bash
yarn generate:types
```

### Adding an admin view or custom field UI

Follow `.agents/skills/payload-build-modules`. Place the implementation in
`src/modules/<module>/admin/<feature>/`. After adding or changing a registered component
path, run:

```bash
yarn generate:importmap
```

### Adding a frontend component

Follow `.agents/skills/payload-frontend-build-components`.

- Generic primitives belong in `src/components/ui`.
- Cross-module application components belong in `src/components/common`.
- Domain-specific components belong in `src/modules/<module>/components/<feature>`.
- Routed pages remain in `src/app/[locale]/(frontend)`.

### AI skills

This project uses skill files for AI-assisted development. Skills are managed with [npx skills](https://github.com/vercel-labs/skills) and installed into `.claude/skills/` (Claude Code) and `.agents/skills/` (Codex).

To install skills from the source repository:

```bash
npx skills add <source-path-or-url> -a claude-code -a codex --copy
```

`.agents/skills/` is the local source of truth. After editing a skill, synchronize it with:

```bash
ags push-skill
```

Do not edit `.claude/skills/` manually; it is a generated copy.

Skills cover: Payload patterns, collection scaffolding, admin module structure, UI copy, and spec writing.

## Screenshots

<p align="center">
  <img src="docs/mockup-1.png" alt="Training App mockup" width="420" />
</p>
